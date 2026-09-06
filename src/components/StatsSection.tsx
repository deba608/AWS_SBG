"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";
import Container from "./Container";
import StatCard from "./StatCard";
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
    <div ref={ref}>
      <StatCard value={String(shown)} suffix={suffix} label={label} />
    </div>
  );
}

export default function StatsSection() {
  return (
    <section aria-label="Community statistics" className="py-10 md:py-14">
      <Container>
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {STATS.map((s) => (
            <Counter key={s.label} value={s.value} suffix={s.suffix} label={s.label} />
          ))}
        </div>
      </Container>
    </section>
  );
}
