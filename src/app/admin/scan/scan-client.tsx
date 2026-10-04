"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Loader2,
  LogOut,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type VerifyState =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "error"; message: string }
  | {
      kind: "result";
      status: "ACTIVE" | "USED" | "INVALID" | "EXPIRED";
      foodStatus?: "FOOD_ACTIVE" | "FOOD_USED";
      type?: "ENTRY" | "FOOD";
      name?: string;
      serial?: string;
      email?: string;
      mobile?: string;
      rollNo?: string;
      food?: string;
      year?: string;
      usedAt?: string | null;
      /** Fresh burn this session (vs already-used). Shows DONE state. */
      justBurned?: boolean;
      justBurnedKind?: "entry" | "food";
    };

type ScanMode = "entry" | "food";

interface Stats {
  issued: number;
  users: number;
  entryActive: number;
  entryUsed: number;
  veg: number;
  nonveg: number;
  foodUsed: number;
  foodActive: number;
}

function tokenFromQRText(text: string): string {
  const t = text.trim();
  // QR holds full URL …/admin/scan?t=TOKEN — extract TOKEN
  try {
    if (t.includes("://") || t.startsWith("/")) {
      const u = new URL(t, window.location.origin);
      return u.searchParams.get("t") ?? u.searchParams.get("token") ?? t;
    }
  } catch {
    // plain token
  }
  // support pasted "t=TOKEN" query fragment
  const m = t.match(/[?&]t=([^&\s]+)/);
  if (m) return decodeURIComponent(m[1]);
  return t;
}

export default function ScanClient({ lockEntry = false }: { lockEntry?: boolean }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [role, setRole] = useState<"admin" | "subadmin" | null>(null);
  const isSubAdmin = role === "subadmin";
  const entryLocked = isSubAdmin || lockEntry;
  const [password, setPassword] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [token, setToken] = useState("");
  const [state, setState] = useState<VerifyState>({ kind: "idle" });
  const [burning, setBurning] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [scanning, setScanning] = useState(false);
  const [camErr, setCamErr] = useState("");
  const [mode, setMode] = useState<ScanMode>(() => {
    try {
      return window.localStorage.getItem("awsScanMode") === "food" ? "food" : "entry";
    } catch {
      return "entry";
    }
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Camera decode callback outlives renders — read live mode through ref
  // so a phone switched to Food counter stops using entry-mode rules.
  const modeRef = useRef<ScanMode>(mode);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const lastScanRef = useRef<string>("");
  const resumeTimer = useRef<number | null>(null);
  const scanningRef = useRef(false);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    scanningRef.current = scanning;
  }, [scanning]);
  // Fast-scan refs: keep stream alive across burns, pause decode instead of
  // tearing down getUserMedia (re-init costs 1-2s per person on gate phones).
  const decodePausedRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<{ detect: (v: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } | null>(null);
  const zxingPromiseRef = useRef<Promise<unknown> | null>(null);
  const verifyCacheRef = useRef(new Map<string, { at: number; body: unknown }>());
  const verifySeqRef = useRef(0);
  const lastStatsAtRef = useRef(0);
  const lastDecodeAtRef = useRef(0);

  const refreshMe = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/me", { cache: "no-store" });
      const d = await r.json();
      setAuthed(Boolean(d.admin));
      setRole(d.role === "subadmin" ? "subadmin" : d.admin ? "admin" : null);
      if (d.role === "subadmin") {
        setMode("entry");
        modeRef.current = "entry";
      }
    } catch {
      setAuthed(false);
      setRole(null);
    }
  }, []);

  const refreshStats = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastStatsAtRef.current < 5000) return;
    lastStatsAtRef.current = now;
    try {
      const r = await fetch("/api/admin/stats", { cache: "no-store" });
      if (r.ok) setStats((await r.json()) as Stats);
    } catch {
      // ignore
    }
  }, []);

  /** Warm scanner libs while admin types — first startCamera then instant. */
  const preloadScanner = useCallback(() => {
    try {
      const BD = (window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector;
      if (BD) {
        const Ctor = BD as new (opts: { formats: string[] }) => { detect: (v: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> };
        detectorRef.current = new Ctor({ formats: ["qr_code", "code_128"] });
      }
    } catch {
      // native unavailable — zxing fallback below
    }
    if (!zxingPromiseRef.current) {
      zxingPromiseRef.current = import("@zxing/browser").catch(() => null);
    }
  }, []);

  useEffect(() => {
    // init once: auth check hits external API
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshMe();
  }, [refreshMe]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginErr("");
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Login failed.");
      setPassword("");
      const loginRole = d.role === "subadmin" ? "subadmin" : "admin";
      setRole(loginRole);
      if (loginRole === "subadmin") {
        setMode("entry");
        modeRef.current = "entry";
      }
      setAuthed(true);
    } catch (err) {
      setLoginErr(err instanceof Error ? err.message : "Login failed.");
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    stopCamera();
    setAuthed(false);
    setRole(null);
    setState({ kind: "idle" });
    setToken("");
  }

  function switchMode(m: ScanMode) {
    // Sub-admin + /check locked to gate entry.
    if (entryLocked) return;
    setMode(m);
    try {
      window.localStorage.setItem("awsScanMode", m);
    } catch {
      // ignore
    }
    // fresh context for the other counter
    resumeNow();
  }

  /** Pause decoding but keep the stream — resume is instant (~50ms). */
  function pauseDecoding() {
    decodePausedRef.current = true;
  }

  function unpauseDecoding() {
    decodePausedRef.current = false;
    lastScanRef.current = "";
  }

  /** Reset to idle + resume decoding (no camera re-init when stream alive). */
  function resumeNow() {
    if (resumeTimer.current) {
      window.clearTimeout(resumeTimer.current);
      resumeTimer.current = null;
    }
    setToken("");
    unpauseDecoding();
    setState({ kind: "idle" });
    if (!scanningRef.current) void startCamera(true);
  }

  function scheduleResume(ms: number) {
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => {
      resumeTimer.current = null;
      setToken("");
      unpauseDecoding();
      setState({ kind: "idle" });
      if (!scanningRef.current) void startCamera(true);
    }, ms);
  }

  function applyVerifyBody(d: unknown) {
    const body = d as {
      status?: string;
      foodStatus?: "FOOD_ACTIVE" | "FOOD_USED";
      type?: "ENTRY" | "FOOD";
      user?: { name?: string; serial?: string; email?: string; mobile?: string; rollNo?: string; food?: string; year?: string };
      usedAt?: string | null;
      error?: string;
    };
    if (body.status === "ACTIVE" || body.status === "USED" || body.status === "EXPIRED") {
      setState({
        kind: "result",
        status: body.status,
        foodStatus: body.foodStatus,
        type: body.type,
        name: body.user?.name,
        serial: body.user?.serial,
        email: body.user?.email,
        mobile: body.user?.mobile,
        rollNo: body.user?.rollNo,
        food: body.user?.food,
        year: body.user?.year,
        usedAt: body.usedAt ?? null,
      });
    } else if (body.error === "Too fast. Slow down.") {
      setState({ kind: "error", message: "Too fast — wait a moment, then retry." });
    } else {
      setState({ kind: "result", status: "INVALID" });
    }
    return body;
  }

  async function verify(raw: string, auto = false) {
    const t = tokenFromQRText(raw);
    if (!t) return;
    setToken(t);
    // Camera re-reads the same QR ~10x/sec — serve repeats from cache.
    const cached = verifyCacheRef.current.get(t);
    // eslint-disable-next-line react-hooks/purity -- event handler, not render
    if (cached && Date.now() - cached.at < 10_000) {
      const body = applyVerifyBody(cached.body);
      if (auto && (body.status === "ACTIVE" || body.status === "USED" || body.status === "EXPIRED")) {
        pauseDecoding();
        const liveMode = modeRef.current;
        const consumed =
          liveMode === "food"
            ? body.foodStatus === "FOOD_USED" || body.status === "EXPIRED"
            : body.status !== "ACTIVE";
        if (consumed) scheduleResume(900);
      }
      return;
    }
    const seq = ++verifySeqRef.current;
    setState({ kind: "busy" });
    try {
      const r = await fetch("/api/passes/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t }),
      });
      const d = await r.json();
      if (seq !== verifySeqRef.current) return; // stale: newer scan won
      if (!r.ok && d.error === "Unauthorized.") {
        setAuthed(false);
        setState({ kind: "idle" });
        return;
      }
      if (d.status === "ACTIVE" || d.status === "USED" || d.status === "EXPIRED") {
        // eslint-disable-next-line react-hooks/purity -- event handler, not render
        verifyCacheRef.current.set(t, { at: Date.now(), body: d });
        if (verifyCacheRef.current.size > 200) {
          const oldest = verifyCacheRef.current.keys().next().value;
          if (oldest) verifyCacheRef.current.delete(oldest);
        }
        if (auto) {
          // freeze decode, keep video: decision made, stop decode spam
          pauseDecoding();
          // Food counter scans the same ENTRY QR: entry USED is the normal
          // case there. Only auto-dismiss when lunch is claimed (or pass
          // expired); otherwise hold the screen for Confirm lunch.
          const liveMode = modeRef.current;
          const consumed =
            liveMode === "food"
              ? d.foodStatus === "FOOD_USED" || d.status === "EXPIRED"
              : d.status !== "ACTIVE";
          if (consumed) scheduleResume(900);
        }
        setState({
          kind: "result",
          status: d.status,
          foodStatus: d.foodStatus,
          type: d.type,
          name: d.user?.name,
          serial: d.user?.serial,
          email: d.user?.email,
          mobile: d.user?.mobile,
          rollNo: d.user?.rollNo,
          food: d.user?.food,
          year: d.user?.year,
          usedAt: d.usedAt ?? null,
        });
      } else if (d.error === "Too fast. Slow down.") {
        setState({ kind: "error", message: "Too fast — wait a moment, then retry." });
      } else {
        setState({ kind: "result", status: "INVALID" });
      }
    } catch {
      if (seq !== verifySeqRef.current) return;
      setState({ kind: "error", message: "Network failed. Check connection, then retry — nothing burned." });
    }
  }

  async function burn() {
    const t = tokenFromQRText(token);
    if (!t || burning) return;
    const kind: ScanMode = entryLocked ? "entry" : mode;
    setBurning(true);
    try {
      const r = await fetch("/api/passes/burn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t, scannedBy: `admin-scan-${kind}`, kind }),
      });
      const d = await r.json();
      if (r.status === 403) {
        setState({ kind: "error", message: d.error ?? "Sub-admin: entry scans only." });
      } else if (r.status === 410 || d.status === "EXPIRED") {
        setState({ kind: "result", status: "EXPIRED", type: d.type });
      } else if (r.status === 409 || d.status === "USED" || d.status === "FOOD_USED") {
        pauseDecoding();
        scheduleResume(900);
        verifyCacheRef.current.delete(t);
        setState({
          kind: "result",
          status: "USED",
          foodStatus: d.status === "FOOD_USED" ? "FOOD_USED" : undefined,
          type: d.type,
          name: d.user?.name,
          serial: d.user?.serial,
          email: d.user?.email,
          mobile: d.user?.mobile,
          rollNo: d.user?.rollNo,
          food: d.user?.food,
          year: d.user?.year,
          usedAt: d.usedAt ?? null,
        });
      } else if (d.ok) {
        pauseDecoding();
        scheduleResume(700);
        verifyCacheRef.current.delete(t);
        setState({
          kind: "result",
          status: "USED",
          foodStatus: d.status === "FOOD_USED" ? "FOOD_USED" : undefined,
          type: d.type,
          name: d.user?.name,
          serial: d.user?.serial,
          email: d.user?.email,
          mobile: d.user?.mobile,
          rollNo: d.user?.rollNo,
          food: d.user?.food,
          year: d.user?.year,
          usedAt: d.usedAt ?? null,
          justBurned: true,
          justBurnedKind: d.kind === "food" ? "food" : "entry",
        });
      } else {
        setState({ kind: "result", status: "INVALID" });
      }
      void refreshStats();
    } catch {
      setState({ kind: "error", message: "Network failed during burn. Verify status before retry — pass may already be burned." });
    } finally {
      setBurning(false);
    }
  }

  function stopLoop() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    try {
      controlsRef.current?.stop();
    } catch {
      // ignore
    }
    controlsRef.current = null;
  }

  function stopCamera() {
    stopLoop();
    decodePausedRef.current = false;
    const s = streamRef.current;
    if (s) {
      for (const tr of s.getTracks()) tr.stop();
      streamRef.current = null;
    }
    const v = videoRef.current;
    if (v?.srcObject) v.srcObject = null;
    scanningRef.current = false;
    setScanning(false);
  }

  function handleDecodedText(text: string) {
    if (decodePausedRef.current) return;
    // eslint-disable-next-line react-hooks/purity -- camera callback, not render
    const now = Date.now();
    // Throttle decode callbacks: camera fires ~10-30x/sec on same QR.
    if (now - lastDecodeAtRef.current < 400) return;
    if (!text || text === lastScanRef.current) return;
    lastDecodeAtRef.current = now;
    lastScanRef.current = text;
    void verify(text, true);
  }

  function startNativeLoop(video: HTMLVideoElement) {
    const detector = detectorRef.current;
    if (!detector) return false;
    stopLoop();
    const tick = async () => {
      if (!scanningRef.current) return;
      try {
        if (!decodePausedRef.current && video.readyState >= 2) {
          const codes = await detector.detect(video);
          const raw = codes?.[0]?.rawValue;
          if (raw) handleDecodedText(raw);
        }
      } catch {
        // single-frame miss — keep looping
      }
      rafRef.current = requestAnimationFrame(() => {
        // ~12fps is plenty for QR + saves battery on gate phones
        window.setTimeout(() => void tick(), 80);
      });
    };
    void tick();
    return true;
  }

  async function startZxingFallback(video: HTMLVideoElement, stream: MediaStream) {
    if (!zxingPromiseRef.current) {
      zxingPromiseRef.current = Promise.all([import("@zxing/browser"), import("@zxing/library")]).catch(() => null);
    }
    const [browserMod, libMod] = ((await zxingPromiseRef.current) ?? []) as unknown as [
      {
        BrowserMultiFormatReader?: new (
          hints?: Map<unknown, unknown>,
        ) => {
          decodeFromStream: (
            s: MediaStream,
            v: HTMLVideoElement,
            cb: (result: { getText: () => string } | null, err: unknown) => void,
          ) => Promise<{ stop: () => void }>;
        };
      } | undefined,
      {
        DecodeHintType?: { POSSIBLE_FORMATS?: unknown };
        BarcodeFormat?: { QR_CODE?: unknown; CODE_128?: unknown };
      } | undefined,
    ];
    const Ctor = browserMod?.BrowserMultiFormatReader;
    if (!Ctor) throw new Error("Scanner unavailable. Use manual entry.");
    stopLoop();
    // QR (entry passes) + Code128 (food tokens). Nothing changes for gate entry.
    let hints: Map<unknown, unknown> | undefined;
    try {
      const key = libMod?.DecodeHintType?.POSSIBLE_FORMATS;
      const formats = [libMod?.BarcodeFormat?.QR_CODE, libMod?.BarcodeFormat?.CODE_128].filter((f) => f !== undefined);
      if (key !== undefined && formats.length === 2) hints = new Map([[key, formats]]);
    } catch {
      hints = undefined;
    }
    const reader = new Ctor(hints);
    const controls = await reader.decodeFromStream(stream, video, (result) => {
      if (result) handleDecodedText(result.getText());
    });
    controlsRef.current = controls;
  }

  async function startCamera(force = false) {
    setCamErr("");
    // Stream already alive → just unpause (instant, no getUserMedia).
    if (scanningRef.current && streamRef.current) {
      if (!force) {
        stopCamera();
        return;
      }
      unpauseDecoding();
      const video = videoRef.current;
      if (video && rafRef.current === null && !controlsRef.current && detectorRef.current) {
        startNativeLoop(video);
      }
      return;
    }
    if (scanningRef.current && !force) {
      stopCamera();
      return;
    }
    preloadScanner();
    try {
      const video = videoRef.current;
      if (!video) return;
      // Low-res = faster decode + faster autofocus on budget gate phones.
      // 640x480 @ ~15fps decodes QR in ~100ms vs ~500ms at 1080p.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 },
        },
        audio: false,
      });
      streamRef.current = stream;
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      await video.play().catch(() => undefined);
      scanningRef.current = true;
      setScanning(true);
      unpauseDecoding();
      // Native BarcodeDetector (Chrome/Edge/Android): hardware-fast, no wasm.
      if (!detectorRef.current) {
        try {
          const BD = (window as unknown as { BarcodeDetector?: new (opts: { formats: string[] }) => { detect: (v: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector;
          if (BD) detectorRef.current = new BD({ formats: ["qr_code", "code_128"] });
        } catch {
          detectorRef.current = null;
        }
      }
      if (detectorRef.current) {
        startNativeLoop(video);
        return;
      }
      await startZxingFallback(video, stream);
    } catch (err) {
      setCamErr(
        err instanceof Error ? err.message : "Camera unavailable. Use manual entry.",
      );
      scanningRef.current = false;
      setScanning(false);
    }
  }

  useEffect(() => {
    if (!authed) return;
    // init: stats + (camera now OR ?t= token verify)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshStats(true);
    preloadScanner();
    const q = new URLSearchParams(window.location.search).get("t");
    if (q) {
      setToken(q);
      void verify(q);
    } else {
      void startCamera();
    }
    // verify/startCamera intentionally run once per login
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  useEffect(() => () => {
    stopCamera();
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (authed === null) {
    return (
      <div className="rank-card flex items-center gap-3 p-6 text-sm text-fog">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Checking admin…
      </div>
    );
  }

  if (!authed) {
    return (
      <form onSubmit={login} className="rank-card space-y-4 p-5 sm:p-6">
        <h2 className="text-lg font-bold text-cream">{lockEntry ? "Gate check login" : "Gate login"}</h2>
        <p className="text-sm text-fog">
          {lockEntry
            ? "Entry verification only. Use gate password."
            : "Full admin or sub-admin (gate) password both work here. Sub-admin gets entry scans only."}
        </p>
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Admin or gate password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full min-h-[44px] rounded-xl border border-line bg-surface px-3 py-3 text-base text-cream focus:ring-2 focus:ring-brand sm:text-sm"
        />
        {loginErr ? (
          <p role="alert" className="text-sm text-red-300">{loginErr}</p>
        ) : null}
        <button
          type="submit"
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-black hover:bg-brandhover"
        >
          Unlock scanner
        </button>
      </form>
    );
  }

  const result = state.kind === "result" ? state : null;
  const justBurned = result?.justBurned === true;
  const lunchClaimed = result?.foodStatus === "FOOD_USED";
  const lunchDone = justBurned && result?.justBurnedKind === "food";
  const resultValid = result !== null && result.status !== "INVALID" && result.status !== "EXPIRED";
  const showGreen =
    result?.status === "ACTIVE" || justBurned || (mode === "food" && result !== null && !lunchClaimed && result.status !== "INVALID" && result.status !== "EXPIRED");
  const showRed =
    !justBurned &&
    (result?.status === "INVALID" ||
      (mode === "entry" && result?.status === "USED") ||
      (mode === "food" && lunchClaimed));

  return (
    <div className="space-y-4">
      <div className="rank-card flex items-center gap-3 px-5 py-3">
        <p className="text-3xl font-bold tabular-nums text-green-400">
          {entryLocked ? (stats?.entryUsed ?? "–") : mode === "food" ? (stats?.foodUsed ?? "–") : (stats?.entryUsed ?? "–")}
        </p>
        <div className="min-w-0 text-xs leading-tight text-fog">
          <p>{!entryLocked && mode === "food" ? "lunches served" : "in gate"}{stats ? ` · ${stats.users} reg` : ""}{entryLocked ? " · entry only" : ""}</p>
          {!entryLocked && stats ? <p>Veg {stats.veg} · Non-veg {stats.nonveg}</p> : null}
        </div>
        <span className="flex-1" aria-hidden />
        {scanning ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-3 py-1 text-xs font-bold text-green-300">
            <span aria-hidden className="h-2 w-2 animate-blink rounded-full bg-green-400" />
            LIVE
          </span>
        ) : null}
        <button
          type="button"
          onClick={logout}
          title="Lock admin"
          aria-label="Lock admin"
          className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-line text-fog hover:text-cream"
        >
          <LogOut className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="rank-card space-y-3 p-4 sm:p-5">
        {entryLocked ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm font-bold text-cream">
            Gate entry — entry scans only
          </div>
        ) : (
        <div
          role="radiogroup"
          aria-label="Counter mode"
          className="flex rounded-2xl border border-line bg-coal p-1.5"
        >
          {(["entry", "food"] as const).map((m) => {
            const active = mode === m;
            return (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  if (!active) switchMode(m);
                }}
                className={cn(
                  "flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all duration-200",
                  active
                    ? m === "entry"
                      ? "bg-gradient-to-b from-brand to-brandpressed text-black shadow-[0_4px_20px_rgba(173,92,255,0.4)]"
                      : "bg-gradient-to-b from-amber-400 to-amber-600 text-black shadow-[0_4px_20px_rgba(251,191,36,0.35)]"
                    : "text-fog hover:text-cream",
                )}
              >
                {m === "entry" ? "Gate entry" : "Food counter"}
              </button>
            );
          })}
        </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-cream">Scan{entryLocked ? " — entry" : ""}</h2>
          <button
            type="button"
            onClick={() => void startCamera()}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line px-4 text-sm text-fog hover:text-cream"
          >
            {scanning ? <CameraOff className="h-4 w-4" aria-hidden /> : <Camera className="h-4 w-4" aria-hidden />}
            {scanning ? "Stop" : "Start"}
          </button>
        </div>
        <div className="relative">
          <video
            ref={videoRef}
            muted
            autoPlay
            playsInline
            onClick={() => {
              if (!scanning && (state.kind === "idle" || state.kind === "error")) void startCamera(true);
            }}
            className={cn(
              "aspect-square w-full rounded-xl border border-line bg-black object-cover",
              !scanning && "hidden",
            )}
          />
          {scanning ? (
            <div aria-hidden className="pointer-events-none absolute inset-3">
              <span className="absolute top-0 left-0 h-8 w-8 rounded-tl-xl border-t-4 border-l-4 border-brand" />
              <span className="absolute top-0 right-0 h-8 w-8 rounded-tr-xl border-t-4 border-r-4 border-brand" />
              <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-xl border-b-4 border-l-4 border-brand" />
              <span className="absolute right-0 bottom-0 h-8 w-8 rounded-br-xl border-r-4 border-b-4 border-brand" />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void startCamera(true)}
              className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-black text-fog hover:text-cream"
            >
              <Camera className="h-8 w-8" aria-hidden />
              <span className="text-sm font-semibold">Tap to start camera</span>
              <span className="text-xs">point at QR — instant verify</span>
            </button>
          )}
        </div>
        {camErr ? <p role="alert" className="text-xs text-red-300">{camErr}</p> : null}
        <details className="rounded-xl border border-line px-4 py-2">
          <summary className="min-h-[44px] cursor-pointer py-2 text-sm text-fog hover:text-cream">
            Manual entry — token or Serial No.
          </summary>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void verify(token);
            }}
            className="flex flex-col gap-2 pb-2 sm:flex-row"
          >
            <input
              ref={inputRef}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Token, QR URL, or Serial No. (A01)…"
              spellCheck={false}
              className="w-full min-h-[44px] flex-1 rounded-xl border border-line bg-surface px-3 py-3 font-mono text-xs text-cream placeholder:text-faint focus:ring-2 focus:ring-brand"
            />
            <button
              type="submit"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-black hover:bg-brandhover"
            >
              Verify
            </button>
          </form>
        </details>
      </div>

      {state.kind === "busy" ? (
        <div className="rank-card flex items-center gap-3 p-6 text-sm text-fog">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Verifying…
        </div>
      ) : null}

      {state.kind === "error" ? (
        <div role="alert" className="rank-card border-amber-500/50 p-5">
          <p className="font-bold text-amber-300">Connection problem</p>
          <p className="mt-1 text-sm text-fog">{state.message}</p>
          <button
            type="button"
            onClick={() => void verify(token)}
            className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-full bg-brand px-6 py-2 text-sm font-semibold text-black hover:bg-brandhover"
          >
            Retry verify
          </button>
        </div>
      ) : null}

      {result ? (
        <div
          role="status"
          key={`${token}-${result.status}-${result.usedAt ?? "active"}-${justBurned ? "burned" : "seen"}`}
          className={cn(
            "rank-card animate-pop-in overflow-hidden",
            showGreen && "border-green-500/50",
            result.status === "EXPIRED" && "border-amber-500/50",
            showRed && "border-red-500/50",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-3 px-5 py-4 text-lg font-bold text-white",
              showGreen && "bg-green-600",
              result.status === "EXPIRED" && "bg-amber-600",
              showRed && "bg-red-600",
            )}
          >
            {showGreen ? (
              <CheckCircle2 className={cn("h-6 w-6", justBurned && "animate-check-pop")} aria-hidden />
            ) : (
              <XCircle className="h-6 w-6" aria-hidden />
            )}
            {lunchDone
              ? "DONE — lunch recorded"
              : justBurned
                ? `DONE — ${result.type ?? "pass"} recorded`
                : mode === "food" && result.status !== "INVALID" && result.status !== "EXPIRED"
                  ? lunchClaimed
                    ? "LUNCH CLAIMED — block"
                    : `LUNCH VALID — serve ${result.food === "Veg" ? "VEG" : "NON-VEG"}`
                  : result.status === "ACTIVE"
                    ? "VALID — allow"
                    : result.status === "USED"
                      ? "ALREADY USED — block"
                      : result.status === "EXPIRED"
                        ? "EXPIRED — block"
                        : "INVALID — block"}
          </div>
          {result.status !== "INVALID" && result.status !== "EXPIRED" ? (
            <div className="space-y-1 p-5">
              <p className="text-xl font-bold text-cream">
                {result.name}
                {result.serial ? <span className="ml-2 font-mono text-sm text-brand">Serial No. {result.serial}</span> : null}
              </p>
              <p className="text-sm text-fog">{result.email}{result.mobile ? ` · ${result.mobile}` : ""} · Roll {result.rollNo}{result.year ? ` · ${result.year} year` : ""}</p>
              {result.food ? (
                <p className={cn(
                  "mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs font-bold",
                  result.food === "Veg" ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-red-400/40 bg-red-400/10 text-red-300",
                )}>
                  <span aria-hidden className={cn("h-2 w-2 rounded-full", result.food === "Veg" ? "bg-emerald-400" : "bg-red-400")} />
                  {result.type} · {result.food === "Veg" ? "VEG" : "NON-VEG"}
                </p>
              ) : (
                <p className="mt-2 inline-block rounded-full bg-white/10 px-3 py-1 font-mono text-xs text-cream">
                  {result.type}
                </p>
              )}
              {result.usedAt ? (
                <p className="text-xs text-fog">Burned at {result.usedAt}</p>
              ) : null}
              {result.status === "USED" || (mode === "food" && lunchClaimed) ? (
                <button
                  type="button"
                  onClick={resumeNow}
                  className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-semibold text-fog hover:text-cream"
                >
                  <Camera className="h-4 w-4" aria-hidden />
                  Next person — tap to scan now
                </button>
              ) : null}
              {(result.status === "ACTIVE" && mode === "entry") ||
              (mode === "food" && !lunchClaimed && resultValid) ? (
                <button
                  type="button"
                  onClick={burn}
                  disabled={burning}
                  className={cn(
                    "mt-4 inline-flex min-h-[56px] w-full items-center justify-center rounded-full px-6 py-3 text-base font-bold text-black disabled:opacity-60",
                    mode === "food"
                      ? "bg-amber-400 hover:bg-amber-300"
                      : "bg-green-500 hover:bg-green-400",
                  )}
                >
                  {burning ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Burning…
                    </>
                  ) : mode === "food" ? (
                    `Confirm lunch (${result.food === "Veg" ? "VEG" : "NON-VEG"}) — burn now`
                  ) : (
                    "Confirm entry — burn now"
                  )}
                </button>
              ) : null}
            </div>
          ) : result.status === "EXPIRED" ? (
            <p className="p-5 text-sm text-fog">
              Event window passed. Pass no longer valid — do not allow entry.
            </p>
          ) : (
            <p className="p-5 text-sm text-fog">
              No match. Check QR, light, or enter token manually.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
