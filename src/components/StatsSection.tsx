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
    <div ref={ref} className="border-l border-line py-2 pl-5">
      <p className="text-4xl font-bold tabular-nums tracking-tight text-cream md:text-5xl">
        {shown}
        {suffix}
      </p>
      <p className="mt-1 text-sm text-fog">{label}</p>
    </div>
  );
}

export default function StatsSection() {
  return (
    <section aria-label="Community statistics" className="py-12 md:py-16">
      <Container>
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
          {STATS.map((s) => (
            <Counter key={s.label} value={s.value} suffix={s.suffix} label={s.label} />
          ))}
        </div>
      </Container>
    </section>
  );
}
