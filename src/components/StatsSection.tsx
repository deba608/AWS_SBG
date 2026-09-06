"use client";

import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Container from "./Container";
import { STATS } from "@/lib/constants";

function Counter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const shown = reduce ? value : display;

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, value, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, reduce]);

  return (
    <div ref={ref} className="px-6 py-6 text-center md:py-8">
      <p className="font-mono text-4xl font-bold tracking-tight text-cream md:text-5xl">
        {shown}
        <span className="text-brand">{suffix}</span>
      </p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-faint">
        {label}
      </p>
    </div>
  );
}

export default function StatsSection() {
  return (
    <section aria-label="Community statistics" className="py-10 md:py-14">
      <Container>
        <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-line bg-surface lg:grid-cols-4 lg:divide-x lg:divide-line">
          {STATS.map((s) => (
            <div key={s.label} className="border-line odd:border-r lg:odd:border-r-0 [&:nth-child(-n+2)]:border-b lg:[&:nth-child(-n+2)]:border-b-0">
              <Counter value={s.value} suffix={s.suffix} label={s.label} />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
