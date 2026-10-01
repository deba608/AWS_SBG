import { CalendarDays, ExternalLink } from "lucide-react";
import { MAKE_A_BOT_FORM_URL, TECH_PARLIAMENT_FORM_URL } from "@/data/events";

/**
 * Post-registration scope note: this QR pass is only for
 * Student Community Day (8th October). Contests need separate sign-ups.
 */
export default function PassScopeNote({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2.5 rounded-xl border border-brand/30 bg-brand/10 p-3 text-sm text-cream">
        <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
        <p className="min-w-0 leading-relaxed">
          <span className="font-semibold">This pass is valid only for Student Community Day — 8th October</span>
          {" "}(Speaker session, Prize Distribution, Lunch &amp; Comedy). You will also receive this pass by email — check inbox + spam.
        </p>
      </div>
      {!compact ? (
        <div className="rounded-xl border border-line bg-surface p-3 text-sm text-fog">
          <p className="font-semibold text-cream">Hackathon, Tech Parliament &amp; Make-A-Bot need separate registration:</p>
          <ul className="mt-2 space-y-1.5">
            <li>
              <a href="/hackathon" className="font-medium text-brand underline decoration-brand/50 underline-offset-4 hover:decoration-cream">
                DecodeX Hackathon (Day 1)
              </a>
              <span> — register your team on this website.</span>
            </li>
            <li>
              <a href={TECH_PARLIAMENT_FORM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-brand underline decoration-brand/50 underline-offset-4 hover:decoration-cream">
                Tech Parliament (Day 2) Google Form <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </li>
            <li>
              <a href={MAKE_A_BOT_FORM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-brand underline decoration-brand/50 underline-offset-4 hover:decoration-cream">
                Make-A-Bot (Day 2) Google Form <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </li>
          </ul>
          <p className="mt-2 text-xs text-faint">Form links are also shared by mail — the Community Day pass alone does not grant contest entry.</p>
        </div>
      ) : null}
    </div>
  );
}
