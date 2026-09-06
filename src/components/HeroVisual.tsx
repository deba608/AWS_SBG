import { Check, Hammer, Users } from "lucide-react";

const lines = [
  { prompt: true, text: "aws sbg init campus-builder" },
  { ok: true, text: "environment ready · ap-south-1" },
  { prompt: true, text: "npm run deploy --prod" },
  { ok: true, text: "live → campusconnect.sbg" },
];

export default function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[440px]" aria-hidden>
      <div className="glow-brand absolute -top-16 left-1/2 h-56 w-96 -translate-x-1/2" aria-hidden />
      <div
        className="animate-drift relative overflow-hidden rounded-2xl border border-line bg-coal/95 shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur"
      >
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-[#FF5F57]" aria-hidden />
          <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" aria-hidden />
          <span className="h-3 w-3 rounded-full bg-[#28C840]" aria-hidden />
          <span className="ml-2 truncate font-mono text-xs text-faint">
            builder@aws-sbg: ~/cloud
          </span>
        </div>
        <div className="bg-grid space-y-2.5 p-5 font-mono text-[13px] leading-relaxed">
          {lines.map((line, i) => (
            <p key={i} className={line.ok ? "flex items-center text-emerald-300" : "text-cream"}>
              {line.prompt ? <span className="mr-2 text-brand">$</span> : null}
              {line.ok ? <Check className="mr-2 h-3.5 w-3.5 shrink-0" /> : null}
              {line.text}
              {i === lines.length - 1 ? (
                <span className="animate-blink ml-1 inline-block h-4 w-2 translate-y-0.5 bg-brand" />
              ) : null}
            </p>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-line px-4 py-2.5 font-mono text-[11px] text-faint">
          <span>λ 3 functions</span>
          <span>42s deploy</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-300">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            live
          </span>
        </div>
      </div>

      <div className="absolute -left-4 top-8 hidden items-center gap-2 rounded-full border border-line bg-surface/95 py-2 pl-2.5 pr-4 shadow-xl backdrop-blur sm:flex">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand/15 text-brand">
          <Users className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span className="text-xs font-semibold text-cream">500+ builders</span>
      </div>
      <div className="absolute -right-3 bottom-10 hidden items-center gap-2 rounded-full border border-line bg-surface/95 py-2 pl-2.5 pr-4 shadow-xl backdrop-blur sm:flex">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand/15 text-brand">
          <Hammer className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span className="text-xs font-semibold text-cream">15+ shipped</span>
      </div>
    </div>
  );
}
