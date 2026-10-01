"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Cpu, Layers, Loader2, Terminal, Trash2, User, Users } from "lucide-react";
import Container from "@/components/Container";
import FoodSelect from "@/components/FoodSelect";
import GenderSelect from "@/components/GenderSelect";
import YearSelect from "@/components/YearSelect";
import { deriveYearFromRollNo, type FoodPref, type Gender, type Year } from "@/lib/validate-contact";
import type { MemberErrors, TeamErrors } from "@/lib/hackathon-store";
import { cn } from "@/lib/utils";

// Mirrors HACKATHON_MAX_MEMBERS + HACKATHON_PREFERENCES in lib/hackathon-store (not imported: server-only module).
const TEAM_MAX = 4;
const PREFS = ["Hardware", "Software", "Both"] as const;
const PREF_ICONS = { Hardware: Cpu, Software: Terminal, Both: Layers } as const;

interface MemberForm {
  name: string;
  rollNo: string;
  email: string;
  mobile: string;
  year: string;
  food: string;
  gender: string;
  githubUrl: string;
}

interface RegisteredTeam {
  id: string;
  teamName: string;
  preference: string;
  leader: MemberForm & { year: string; food: string; gender: string };
  members: (MemberForm & { year: string; food: string; gender: string })[];
  createdAt: string;
}

const blankMember = (): MemberForm => ({ name: "", rollNo: "", email: "", mobile: "", year: "", food: "", gender: "", githubUrl: "" });

const inputCls = (bad: boolean) =>
  `w-full min-h-[44px] rounded-xl border bg-surface px-3 py-3 text-base text-cream placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-brand sm:text-sm ${
    bad ? "border-red-400/70" : "border-line"
  }`;

function Field({
  label, value, onChange, error, placeholder, type, inputMode, maxLength, autoComplete, upper,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder: string;
  type?: string;
  inputMode?: "email" | "numeric" | "text";
  maxLength?: number;
  autoComplete?: string;
  upper?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-cream">{label}</label>
      <input
        type={type ?? "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete ?? "off"}
        inputMode={inputMode}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        className={cn(inputCls(Boolean(error)), upper && "uppercase")}
      />
      {error ? <p role="alert" className="mt-1.5 text-xs text-red-300">{error}</p> : null}
    </div>
  );
}

function MemberFields({
  title, icon, value, onChange, errors, idPrefix, onRemove, removable, showGithub,
}: {
  title: string;
  icon: React.ReactNode;
  value: MemberForm;
  onChange: (v: MemberForm) => void;
  errors?: MemberErrors;
  idPrefix: string;
  onRemove?: () => void;
  removable?: boolean;
  showGithub?: boolean;
}) {
  const set = (k: keyof MemberForm) => (v: string) => {
    if (k === "rollNo" && !value.year) {
      const detected = deriveYearFromRollNo(v);
      onChange({ ...value, [k]: v, year: detected ?? value.year });
    } else {
      onChange({ ...value, [k]: v });
    }
  };
  return (
    <div className="rounded-2xl border border-line bg-ink/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-bold text-cream">
          <span className="text-brand">{icon}</span> {title}
        </p>
        {removable ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${title}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-faint hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Full name *" value={value.name} onChange={set("name")} error={errors?.name} placeholder="Debashish Pradhan" maxLength={60} autoComplete="name" />
        <Field label="Roll number *" value={value.rollNo} onChange={set("rollNo")} error={errors?.rollNo} placeholder="24BTCSE26" maxLength={20} upper />
        <Field label="College mail *" value={value.email} onChange={set("email")} error={errors?.email} placeholder="24btcse26@suiit.ac.in" type="email" inputMode="email" maxLength={100} autoComplete="email" />
        <Field label="Mobile number *" value={value.mobile} onChange={set("mobile")} error={errors?.mobile} placeholder="9437512345" type="tel" inputMode="numeric" maxLength={13} autoComplete="tel-national" />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <GenderSelect
          value={value.gender}
          onChange={(g: Gender) => onChange({ ...value, gender: g })}
          labelId={`${idPrefix}-gender`}
          error={errors?.gender}
        />
        <FoodSelect
          value={value.food}
          onChange={(f: FoodPref) => onChange({ ...value, food: f })}
          labelId={`${idPrefix}-food`}
          error={errors?.food}
        />
      </div>
      <div className="mt-3">
        <YearSelect
          value={value.year}
          onChange={(y: Year) => onChange({ ...value, year: y })}
          labelId={`${idPrefix}-year`}
          error={errors?.year}
        />
      </div>
      {showGithub ? (
        <div className="mt-3">
          <Field label="GitHub profile URL *" value={value.githubUrl} onChange={set("githubUrl")} error={errors?.githubUrl} placeholder="https://github.com/username" type="url" inputMode="text" maxLength={200} autoComplete="url" />
        </div>
      ) : null}
    </div>
  );
}

function PreferenceSelect({
  value, onChange, error,
}: {
  value: string;
  onChange: (p: string) => void;
  error?: string;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-cream" id="hack-pref-label">
        Project preference *
      </span>
      <div role="radiogroup" aria-labelledby="hack-pref-label" className="grid grid-cols-3 gap-2">
        {PREFS.map((p) => {
          const active = value === p;
          const Icon = PREF_ICONS[p];
          return (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(p)}
              className={cn(
                "flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-sm font-semibold transition-all",
                active
                  ? "border-brand/60 bg-brand/10 text-cream shadow-[0_0_20px_rgba(173,92,255,0.18)]"
                  : "border-line bg-surface text-fog hover:border-faint hover:text-cream",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {p}
            </button>
          );
        })}
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-red-300">{error}</p>
      ) : null}
    </div>
  );
}

export default function HackathonClient() {
  const [teamName, setTeamName] = useState("");
  const [preference, setPreference] = useState("");
  const [declaration, setDeclaration] = useState(false);
  const [leader, setLeader] = useState<MemberForm>(blankMember());
  const [members, setMembers] = useState<MemberForm[]>([blankMember(), blankMember(), blankMember()]);
  const [errors, setErrors] = useState<TeamErrors>({});
  const [status, setStatus] = useState<"form" | "busy" | "done">("form");
  const [apiError, setApiError] = useState("");
  const [team, setTeam] = useState<RegisteredTeam | null>(null);
  const [slots, setSlots] = useState<{ registered: number; limit: number; open: boolean } | null>(null);
  // Fixed squad: leader + exactly 3 teammates.

  useEffect(() => {
    fetch("/api/hackathon/register?count=1", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.registered === "number") setSlots(d);
      })
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("busy");
    setApiError("");
    setErrors({});
    try {
      const res = await fetch("/api/hackathon/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName, preference, declaration, leader, members }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors as TeamErrors);
        throw new Error(data.error ?? "Registration failed.");
      }
      setTeam(data.team as RegisteredTeam);
      setStatus("done");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Registration failed.");
      setStatus("form");
    }
  }

  if (status === "done" && team) {
    const total = 1 + team.members.length;
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-center">
          <span className="animate-check-pop mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-green-500/20">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-green-300" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <p className="mt-2 text-base font-bold text-cream">Team {team.teamName} is in!</p>
          <p className="mt-0.5 text-xs leading-relaxed text-green-200/80">
            DecodeX Hackathon · Day 1, 6th October · {total} member{total === 1 ? "" : "s"} · {team.preference} track · Team ID {team.id}
          </p>
        </div>
        <div className="rounded-xl border border-brand/30 bg-brand/10 p-3 text-sm leading-relaxed text-cream">
          Each member still needs their own <span className="font-semibold">Community Day pass (8th October)</span> for Day-3 entry + lunch —{" "}
          <a href="/passes" className="font-medium text-brand underline decoration-brand/50 underline-offset-4 hover:decoration-cream">
            get passes here
          </a>.
        </div>
        <div className="rounded-2xl border border-line bg-ink/40 p-4">
          <p className="text-sm font-bold text-cream">{team.teamName}</p>
          <ul className="mt-2 space-y-1.5 text-sm text-fog">
            <li><span className="font-semibold text-cream">{team.leader.name}</span> (leader) · {team.leader.rollNo} · {team.leader.year} year · {team.leader.gender} · {team.leader.food}</li>
            {team.members.map((m) => (
              <li key={m.rollNo}><span className="font-semibold text-cream">{m.name}</span> · {m.rollNo} · {m.year} year · {m.gender} · {m.food}</li>
            ))}
          </ul>
        </div>
        <a
          href="/events/awsscd26"
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-line px-6 py-3 text-sm text-fog hover:text-cream"
        >
          Back to Community Day
          <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
      </div>
    );
  }

  function fillDemo() {
    setTeamName("Demo Debuggers");
    setPreference("Both");
    setDeclaration(true);
    setLeader({ name: "Aarav Sharma", rollNo: "24BTCSE01", email: "24btcse01@suiit.ac.in", mobile: "9437100001", year: "3rd", food: "Veg", gender: "Male", githubUrl: "https://github.com/aaravsharma" });
    setMembers([
      { name: "Diya Patel", rollNo: "24BTCSE02", email: "24btcse02@suiit.ac.in", mobile: "9437100002", year: "3rd", food: "Non-veg", gender: "Female", githubUrl: "" },
      { name: "Rohan Das", rollNo: "25BTCSE11", email: "25btcse11@suiit.ac.in", mobile: "9437100003", year: "2nd", food: "Veg", gender: "Male", githubUrl: "" },
      { name: "Sneha Mishra", rollNo: "25BTCSE12", email: "25btcse12@suiit.ac.in", mobile: "9437100004", year: "2nd", food: "Veg", gender: "Female", githubUrl: "" },
    ]);
    setErrors({});
    setApiError("");
  }

  return (
    <Container className="rank-card p-5 sm:p-6">
      {slots && !slots.open ? (
        <p role="alert" className="mb-4 rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
          Hackathon team slots full ({slots.registered}/{slots.limit}) — contact organizers for waitlist.
        </p>
      ) : slots ? (
        <p className="mb-4 rounded-xl border border-line bg-ink/40 p-3 text-sm text-fog">
          <span className="font-mono font-bold text-cream">{slots.registered}/{slots.limit}</span> team slots claimed.
        </p>
      ) : null}
      <form noValidate onSubmit={submit} className="space-y-4">
        <div className="flex justify-end print:hidden">
          <button
            type="button"
            onClick={fillDemo}
            title="Fill sample values to preview the form — edit before submitting"
            className="inline-flex min-h-[40px] items-center rounded-full border border-dashed border-line px-4 py-1.5 text-xs font-semibold text-faint hover:text-cream"
          >
            Fill demo data
          </button>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-cream">Team name *</label>
          <input
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Binary Builders"
            maxLength={40}
            autoComplete="off"
            aria-invalid={Boolean(errors.teamName)}
            className={inputCls(Boolean(errors.teamName))}
          />
          {errors.teamName ? <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.teamName}</p> : null}
        </div>

        <PreferenceSelect value={preference} onChange={setPreference} error={errors.preference} />

        <MemberFields
          title="Team leader"
          icon={<User className="h-4 w-4" aria-hidden />}
          value={leader}
          onChange={setLeader}
          errors={errors.leader}
          idPrefix="hack-leader"
          showGithub
        />

        {members.map((m, i) => (
          <MemberFields
            key={i}
            title={`Teammate ${i + 1}`}
            icon={<Users className="h-4 w-4" aria-hidden />}
            value={m}
            onChange={(v) => setMembers((prev) => prev.map((p, j) => (j === i ? v : p)))}
            errors={errors.members?.[i]}
            idPrefix={`hack-member-${i}`}
          />
        ))}

        {errors.team ? (
          <p role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">{errors.team}</p>
        ) : (
          <p className="text-xs text-faint">Teams of exactly {TEAM_MAX} — leader + 3 teammates, all details required.</p>
        )}
        <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm leading-relaxed ${errors.declaration ? "border-red-400/70 bg-red-500/10" : "border-line bg-ink/40"}`}>
          <input
            type="checkbox"
            checked={declaration}
            onChange={(e) => setDeclaration(e.target.checked)}
            aria-invalid={Boolean(errors.declaration)}
            className="mt-1 h-5 w-5 min-h-[20px] min-w-[20px] shrink-0 cursor-pointer accent-[#ad5cff]"
          />
          <span className="text-fog">
            <span className="font-semibold text-cream">Declaration: </span>
            I declare that all team details are correct, every member is an eligible SUIIT student,
            our hackathon work will be original, and our team will follow the event rules and code of conduct. *
          </span>
        </label>
        {errors.declaration ? (
          <p role="alert" className="-mt-2 text-xs text-red-300">{errors.declaration}</p>
        ) : null}
        {apiError ? (
          <p role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
            {apiError}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={status === "busy" || (slots !== null && !slots.open)}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-black hover:bg-brandhover disabled:opacity-70"
        >
          {status === "busy" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Registering team…
            </>
          ) : (
            <>
              Register team
              <ArrowRight className="h-4 w-4" aria-hidden />
            </>
          )}
        </button>
      </form>
    </Container>
  );
}
