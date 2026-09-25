"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import PassCard from "@/components/PassCard";

interface FoundPass {
  type: "ENTRY" | "FOOD";
  token: string;
  qrContent: string;
  qrImage: string;
  status: string;
}

interface FoundUser {
  name: string;
  serial: string;
  email: string;
  mobile: string;
  rollNo: string;
  gender: string;
  food: string;
}

/** Lost QR? Look up by college mail, roll no, or mobile. */
export default function RetrievePass() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");
  const [user, setUser] = useState<FoundUser | null>(null);
  const [passes, setPasses] = useState<FoundPass[]>([]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setStatus("busy");
    setError("");
    try {
      const params = new URLSearchParams();
      if (q.includes("@")) params.set("email", q.toLowerCase());
      else if (/^[\d+\s]+$/.test(q)) params.set("mobile", q.replace(/\D/g, ""));
      else params.set("rollNo", q.toUpperCase());
      const res = await fetch(`/api/passes/issue?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No pass found.");
      setUser(data.user as FoundUser);
      setPasses(data.passes as FoundPass[]);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pass found.");
      setStatus("idle");
    }
  }

  return (
    <div className="rank-card mt-8 p-5 sm:p-6">
      <h2 className="text-lg font-bold text-cream">Already registered? Get your pass back</h2>
      <p className="mt-1 text-sm text-fog">
        Lost your QR? Enter college mail, roll number, or mobile — one pass per student, no duplicates.
      </p>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="24btcse26@suiit.ac.in / 24BTCSE26 / 98765 43210"
          spellCheck={false}
          autoComplete="off"
          aria-label="College mail, roll number, or mobile"
          className="w-full min-h-[44px] flex-1 rounded-xl border border-line bg-surface px-3 py-3 text-base text-cream placeholder:text-faint focus:ring-2 focus:ring-brand sm:text-sm"
        />
        <button
          type="submit"
          disabled={status === "busy"}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-black hover:bg-brandhover disabled:opacity-60"
        >
          {status === "busy" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Search className="h-4 w-4" aria-hidden />
          )}
          Find my pass
        </button>
      </form>
      {error ? (
        <p role="alert" className="mt-3 rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      {status === "done" && user ? (
        <div className="mt-5 space-y-4">
          {passes.map((p) => (
            <PassCard
              key={p.type}
              name={user.name}
              serial={user.serial ?? ""}
              email={user.email}
              mobile={user.mobile ?? ""}
              rollNo={user.rollNo}
              food={user.food}
              type={p.type}
              qrImage={p.qrImage}
              token={p.token}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
