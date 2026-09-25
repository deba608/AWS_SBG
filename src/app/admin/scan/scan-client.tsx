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
    if (authed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void refreshStats();
      // prefill when generic camera app opens QR URL directly
      const q = new URLSearchParams(window.location.search).get("t");
      if (q) {
        setToken(q);
        // eslint-disable-next-line react-hooks/exhaustive-deps
        void verify(q);
      } else {
        // gate flow: camera on immediately, zero taps to first scan
        // eslint-disable-next-line react-hooks/exhaustive-deps
        void startCamera();
      }
    }
  }, [authed, refreshStats]);

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
              void verify(text);
              // pause 2s to avoid double-fire on same QR
              window.setTimeout(() => {
                lastScanRef.current = "";
              }, 2000);
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

  function scanNext() {
    setToken("");
    lastScanRef.current = "";
    setState({ kind: "idle" });
    inputRef.current?.focus();
    if (resumeCamRef.current) {
      resumeCamRef.current = false;
      void startCamera();
    }
  }

  return (
    <div className="space-y-5">
      {stats ? (
        <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          {[
            { label: "Users", v: stats.users },
            { label: "Entry in", v: stats.entryUsed },
            { label: "Veg", v: stats.veg },
            { label: "Non-veg", v: stats.nonveg },
          ].map((s) => (
            <div key={s.label} className="rank-card p-3">
              <p className="text-2xl font-bold text-cream">{s.v}</p>
              <p className="text-xs text-fog">{s.label}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="rank-card space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-cream">Scan</h2>
          <button
            type="button"
            onClick={logout}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line px-4 text-sm text-fog hover:text-cream"
          >
            <LogOut className="h-4 w-4" aria-hidden /> Lock
          </button>
        </div>
        <video
          ref={videoRef}
          muted
          playsInline
          className={cn(
            "aspect-video w-full rounded-xl border border-line bg-black object-cover",
            !scanning && "hidden",
          )}
        />
        {camErr ? <p role="alert" className="text-xs text-red-300">{camErr}</p> : null}
        <button
          type="button"
          onClick={startCamera}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-semibold text-cream hover:border-white/25"
        >
          {scanning ? <CameraOff className="h-4 w-4" aria-hidden /> : <Camera className="h-4 w-4" aria-hidden />}
          {scanning ? "Stop camera" : "Start camera scan"}
        </button>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void verify(token);
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <input
            ref={inputRef}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste token or full QR URL…"
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
                  onClick={scanNext}
                  className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-brand px-6 py-3 text-base font-bold text-black hover:bg-brandhover"
                >
                  Scan next
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
