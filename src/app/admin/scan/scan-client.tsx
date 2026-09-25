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
      type?: "ENTRY" | "FOOD";
      name?: string;
      serial?: string;
      email?: string;
      mobile?: string;
      rollNo?: string;
      food?: string;
      usedAt?: string | null;
      /** Fresh burn this session (vs already-used). Shows DONE state. */
      justBurned?: boolean;
    };

interface Stats {
  issued: number;
  users: number;
  entryActive: number;
  entryUsed: number;
  veg: number;
  nonveg: number;
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

export default function ScanClient() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [token, setToken] = useState("");
  const [state, setState] = useState<VerifyState>({ kind: "idle" });
  const [burning, setBurning] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [scanning, setScanning] = useState(false);
  const [camErr, setCamErr] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const lastScanRef = useRef<string>("");
  const resumeTimer = useRef<number | null>(null);
  const scanningRef = useRef(false);
  scanningRef.current = scanning;

  const refreshMe = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/me", { cache: "no-store" });
      const d = await r.json();
      setAuthed(Boolean(d.admin));
    } catch {
      setAuthed(false);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/stats", { cache: "no-store" });
      if (r.ok) setStats((await r.json()) as Stats);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    // init once: auth check hits external API
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    if (!authed) return;
    // init: stats + (camera now OR ?t= token verify)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshStats();
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
    setState({ kind: "idle" });
    setToken("");
  }

  /** Reset to idle + camera back on (continuous gate mode). */
  function resumeNow() {
    if (resumeTimer.current) {
      window.clearTimeout(resumeTimer.current);
      resumeTimer.current = null;
    }
    setToken("");
    lastScanRef.current = "";
    setState({ kind: "idle" });
    void startCamera(true);
  }

  function scheduleResume(ms: number) {
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => {
      resumeTimer.current = null;
      setToken("");
      lastScanRef.current = "";
      setState({ kind: "idle" });
      void startCamera(true);
    }, ms);
  }

  async function verify(raw: string, auto = false) {
    const t = tokenFromQRText(raw);
    if (!t) return;
    setToken(t);
    setState({ kind: "busy" });
    try {
      const r = await fetch("/api/passes/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t }),
      });
      const d = await r.json();
      if (!r.ok && d.error === "Unauthorized.") {
        setAuthed(false);
        setState({ kind: "idle" });
        return;
      }
      if (d.status === "ACTIVE" || d.status === "USED" || d.status === "EXPIRED") {
        if (auto) {
          // freeze frame: decision made, stop decode spam
          stopCamera();
          if (d.status !== "ACTIVE") scheduleResume(2400);
        }
        setState({
          kind: "result",
          status: d.status,
          type: d.type,
          name: d.user?.name,
          serial: d.user?.serial,
          email: d.user?.email,
          mobile: d.user?.mobile,
          rollNo: d.user?.rollNo,
          food: d.user?.food,
          usedAt: d.usedAt ?? null,
        });
      } else if (d.error === "Too fast. Slow down.") {
        setState({ kind: "error", message: "Too fast — wait a moment, then retry." });
      } else {
        setState({ kind: "result", status: "INVALID" });
      }
    } catch {
      setState({ kind: "error", message: "Network failed. Check connection, then retry — nothing burned." });
    }
  }

  async function burn() {
    const t = tokenFromQRText(token);
    if (!t || burning) return;
    setBurning(true);
    try {
      const r = await fetch("/api/passes/burn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t, scannedBy: "admin-scan" }),
      });
      const d = await r.json();
      if (r.status === 410 || d.status === "EXPIRED") {
        setState({ kind: "result", status: "EXPIRED", type: d.type });
      } else if (r.status === 409 || d.status === "USED") {
        stopCamera();
        scheduleResume(2400);
        setState({
          kind: "result",
          status: "USED",
          type: d.type,
          name: d.user?.name,
          serial: d.user?.serial,
          email: d.user?.email,
          mobile: d.user?.mobile,
          rollNo: d.user?.rollNo,
          food: d.user?.food,
          usedAt: d.usedAt ?? null,
        });
      } else if (d.ok) {
        stopCamera();
        scheduleResume(1500);
        setState({
          kind: "result",
          status: "USED",
          type: d.type,
          name: d.user?.name,
          serial: d.user?.serial,
          email: d.user?.email,
          mobile: d.user?.mobile,
          rollNo: d.user?.rollNo,
          food: d.user?.food,
          usedAt: d.usedAt ?? null,
          justBurned: true,
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

  function stopCamera() {
    try {
      controlsRef.current?.stop();
    } catch {
      // ignore
    }
    controlsRef.current = null;
    const v = videoRef.current;
    if (v?.srcObject) {
      for (const tr of (v.srcObject as MediaStream).getTracks()) tr.stop();
      v.srcObject = null;
    }
    scanningRef.current = false;
    setScanning(false);
  }

  async function startCamera(force = false) {
    setCamErr("");
    if (scanningRef.current) {
      if (!force) stopCamera();
      return;
    }
    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const reader = new BrowserQRCodeReader();
      const video = videoRef.current;
      if (!video) return;
      scanningRef.current = true;
      setScanning(true);
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        video,
        (result, err) => {
          if (result) {
            const text = result.getText();
            if (text && text !== lastScanRef.current) {
              lastScanRef.current = text;
              void verify(text, true);
            }
          }
          if (err && !(err instanceof Error)) setCamErr("Camera read error.");
        },
      );
      controlsRef.current = controls;
    } catch (err) {
      setCamErr(
        err instanceof Error ? err.message : "Camera unavailable. Use manual entry.",
      );
      scanningRef.current = false;
      setScanning(false);
    }
  }

  useEffect(() => () => {
    stopCamera();
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
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
        <h2 className="text-lg font-bold text-cream">Admin login</h2>
        <p className="text-sm text-fog">
          Enter gate password. Set via <code className="font-mono">ADMIN_PASS</code> env
          in production.
        </p>
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Admin password"
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

  return (
    <div className="space-y-4">
      <div className="rank-card flex items-center gap-3 px-5 py-3">
        <p className="text-3xl font-bold tabular-nums text-green-400">
          {stats?.entryUsed ?? "–"}
        </p>
        <div className="min-w-0 text-xs leading-tight text-fog">
          <p>in gate{stats ? ` · ${stats.users} reg` : ""}</p>
          {stats ? <p>Veg {stats.veg} · Non-veg {stats.nonveg}</p> : null}
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
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-cream">Scan</h2>
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
            playsInline
            onClick={() => {
              if (!scanning && (state.kind === "idle" || state.kind === "error")) void startCamera(true);
            }}
            className={cn(
              "aspect-[4/3] w-full rounded-xl border border-line bg-black object-cover",
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
              className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-black text-fog hover:text-cream"
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
            (result.status === "ACTIVE" || justBurned) && "border-green-500/50",
            result.status === "EXPIRED" && "border-amber-500/50",
            (!justBurned && (result.status === "USED" || result.status === "INVALID")) && "border-red-500/50",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-3 px-5 py-4 text-lg font-bold text-white",
              (result.status === "ACTIVE" || justBurned) && "bg-green-600",
              result.status === "EXPIRED" && "bg-amber-600",
              (!justBurned && (result.status === "USED" || result.status === "INVALID")) && "bg-red-600",
            )}
          >
            {result.status === "ACTIVE" || justBurned ? (
              <CheckCircle2 className={cn("h-6 w-6", justBurned && "animate-check-pop")} aria-hidden />
            ) : (
              <XCircle className="h-6 w-6" aria-hidden />
            )}
            {justBurned
              ? `DONE — ${result.type ?? "pass"} recorded`
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
              <p className="text-sm text-fog">{result.email}{result.mobile ? ` · ${result.mobile}` : ""} · Roll {result.rollNo}</p>
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
              {result.status === "USED" ? (
                <button
                  type="button"
                  onClick={resumeNow}
                  className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-semibold text-fog hover:text-cream"
                >
                  <Camera className="h-4 w-4" aria-hidden />
                  Next person — tap to scan now
                </button>
              ) : null}
              {result.status === "ACTIVE" ? (
                <button
                  type="button"
                  onClick={burn}
                  disabled={burning}
                  className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-green-500 px-6 py-3 text-base font-bold text-black hover:bg-green-400 disabled:opacity-60"
                >
                  {burning ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Burning…
                    </>
                  ) : (
                    `Confirm ${result.type === "ENTRY" ? "entry" : "food"} — burn now`
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
