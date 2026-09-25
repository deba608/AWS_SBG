"use client";

import { useState } from "react";

export default function AdminLogin({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Login failed.");
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rank-card space-y-4 p-5 sm:p-6">
      <h2 className="text-lg font-bold text-cream">Admin login</h2>
      <p className="text-sm text-fog">
        Enter gate password to continue.
      </p>
      <input
        type="password"
        autoComplete="current-password"
        placeholder="Admin password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full min-h-[44px] rounded-xl border border-line bg-surface px-3 py-3 text-base text-cream focus:ring-2 focus:ring-brand sm:text-sm"
      />
      {err ? (
        <p role="alert" className="text-sm text-red-300">{err}</p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-black hover:bg-brandhover disabled:opacity-60"
      >
        {busy ? "Checking…" : "Unlock"}
      </button>
    </form>
  );
}
