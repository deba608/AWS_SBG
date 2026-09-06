"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/*
 * Deliberately near-invisible. Pages wrap content in Reveal for
 * progressive disclosure only — the single orchestrated moment
 * lives on the home hero, owned elsewhere.
 */
export default function Reveal({
  children,
  delay = 0,
  className,
  y = 8,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3, delay: Math.min(delay, 0.15), ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
