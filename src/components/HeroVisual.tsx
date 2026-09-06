"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";

type Line = { kind: "command" | "output"; text: string };

const lines: Line[] = [
  { kind: "command", text: "aws sts get-caller-identity --region ap-south-1" },
  { kind: "output", text: "identity verified · student-builder" },
  { kind: "command", text: "sam build" },
  { kind: "output", text: "build succeeded in 18s · 3 functions" },
  { kind: "command", text: "sam deploy --region ap-south-1" },
  { kind: "output", text: "stack deployed · campusconnect-prod" },
  { kind: "command", text: "aws amplify publish --yes" },
  { kind: "output", text: "live → https://campusconnect.sbg · 42s" },
];

function LineRow({ line, isLast }: { line: Line; isLast: boolean }) {
  if (line.kind === "command") {
    return (
      <p className="break-all text-cream">
        <span className="mr-2 text-faint" aria-hidden>
          $
        </span>
        {line.text}
        {isLast ? (
          <span
            className="animate-blink ml-1 inline-block h-4 w-2 translate-y-0.5 bg-cream"
            aria-hidden
          />
        ) : null}
      </p>
    );
  }
  return (
    <p className="flex items-start gap-2 text-fog">
      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" aria-hidden />
      <span className="break-all">{line.text}</span>
      {isLast ? (
        <span
          className="animate-blink ml-1 inline-block h-4 w-2 shrink-0 translate-y-0.5 bg-cream"
          aria-hidden
        />
      ) : null}
    </p>
  );
}

export default function HeroVisual() {
  const reduce = useReducedMotion();

  return (
    <div className="mx-auto w-full max-w-[480px]">
      <div className="overflow-hidden rounded-xl border border-line bg-coal shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-[#FF5F57]" aria-hidden />
          <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" aria-hidden />
          <span className="h-3 w-3 rounded-full bg-[#28C840]" aria-hidden />
          <span className="ml-2 truncate font-mono text-xs text-faint">
            deploy — zsh
          </span>
        </div>

        {reduce ? (
          <div className="space-y-2.5 p-5 font-mono text-[13px] leading-relaxed">
            {lines.map((line, i) => (
              <LineRow key={i} line={line} isLast={i === lines.length - 1} />
            ))}
          </div>
        ) : (
          <motion.div
            className="space-y-2.5 p-5 font-mono text-[13px] leading-relaxed"
            initial="hidden"
            animate="show"
            variants={{
              show: { transition: { staggerChildren: 0.3, delayChildren: 0.15 } },
            }}
          >
            {lines.map((line, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 4 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
                }}
              >
                <LineRow line={line} isLast={i === lines.length - 1} />
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="flex items-center justify-between border-t border-line px-4 py-2.5 font-mono text-[11px] text-faint">
          <span>ap-south-1</span>
          <span>42s deploy</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-300">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"
              aria-hidden
            />
            live
          </span>
        </div>
      </div>
    </div>
  );
}
