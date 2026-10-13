"use client";

import { useEffect, useRef } from "react";
import { SUBTLE_GRID } from "./CursorGrid";

interface Pulse {
  x: number;
  y: number;
  t0: number;
}

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(v.slice(0, 6), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
};

const FALLOFF = (t: number) => t * t * (3 - 2 * t); // smooth

/**
 * Site-wide fixed viewport grid — same whisper-quiet SUBTLE_GRID look as the
 * team page, but viewport-locked behind every page. Listens on window so it
 * works even though the canvas sits behind content (pointer-events-none).
 * Single canvas, sleeps when idle, honors prefers-reduced-motion.
 */
export default function GlobalCursorGrid() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const p = {
      cellSize: SUBTLE_GRID.cellSize ?? 72,
      color: SUBTLE_GRID.color ?? "#ad5cff",
      radius: SUBTLE_GRID.radius ?? 130,
      holdTime: SUBTLE_GRID.holdTime ?? 250,
      fadeDuration: SUBTLE_GRID.fadeDuration ?? 900,
      lineWidth: SUBTLE_GRID.lineWidth ?? 1,
      maxOpacity: SUBTLE_GRID.maxOpacity ?? 0.12,
      fillOpacity: SUBTLE_GRID.fillOpacity ?? 0,
      gridOpacity: SUBTLE_GRID.gridOpacity ?? 0.012,
      cellRadius: SUBTLE_GRID.cellRadius ?? 6,
      clickPulse: SUBTLE_GRID.clickPulse ?? true,
      pulseSpeed: SUBTLE_GRID.pulseSpeed ?? 520,
    };

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let cols = 0;
    let rows = 0;
    let offX = 0;
    let offY = 0;
    let alphas = new Float32Array(0);
    let touched = new Float64Array(0);
    let w = 0;
    let h = 0;
    const pulses: Pulse[] = [];
    let raf = 0;
    let running = false;
    let lastFrame = 0;

    const rebuild = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / p.cellSize) + 1;
      rows = Math.ceil(h / p.cellSize) + 1;
      offX = (w - cols * p.cellSize) / 2;
      offY = (h - rows * p.cellSize) / 2;
      alphas = new Float32Array(cols * rows);
      touched = new Float64Array(cols * rows);
    };

    const cellCenter = (i: number): [number, number] => [
      offX + (i % cols) * p.cellSize + p.cellSize / 2,
      offY + Math.floor(i / cols) * p.cellSize + p.cellSize / 2,
    ];

    const energize = (x: number, y: number, boost?: number) => {
      const r = Math.max(p.radius, 1);
      const now = performance.now();
      const minCol = Math.max(0, Math.floor((x - r - offX) / p.cellSize));
      const maxCol = Math.min(cols - 1, Math.floor((x + r - offX) / p.cellSize));
      const minRow = Math.max(0, Math.floor((y - r - offY) / p.cellSize));
      const maxRow = Math.min(rows - 1, Math.floor((y + r - offY) / p.cellSize));
      for (let cRow = minRow; cRow <= maxRow; cRow++) {
        for (let cCol = minCol; cCol <= maxCol; cCol++) {
          const i = cRow * cols + cCol;
          const [cx, cy] = cellCenter(i);
          const dist = Math.hypot(cx - x, cy - y);
          if (dist > r) continue;
          const level = FALLOFF(1 - dist / r) * p.maxOpacity * (boost ?? 1);
          if (level > alphas[i]) {
            alphas[i] = level;
            touched[i] = now;
          } else if (level > 0) {
            touched[i] = now;
          }
        }
      }
    };

    const draw = (now: number) => {
      const dt = Math.min(now - lastFrame, 50);
      lastFrame = now;
      ctx.clearRect(0, 0, w, h);
      const [cr, cg, cb] = hexToRgb(p.color);

      if (p.gridOpacity > 0) {
        ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${p.gridOpacity})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let cCol = 0; cCol <= cols; cCol++) {
          const x = Math.round(offX + cCol * p.cellSize) + 0.5;
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
        }
        for (let cRow = 0; cRow <= rows; cRow++) {
          const y = Math.round(offY + cRow * p.cellSize) + 0.5;
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
        }
        ctx.stroke();
      }

      for (let pi = pulses.length - 1; pi >= 0; pi--) {
        const pulse = pulses[pi];
        const age = (now - pulse.t0) / 1000;
        const ringR = age * p.pulseSpeed;
        if (ringR > Math.hypot(w, h)) {
          pulses.splice(pi, 1);
          continue;
        }
        const band = p.cellSize;
        const minCol = Math.max(0, Math.floor((pulse.x - ringR - band - offX) / p.cellSize));
        const maxCol = Math.min(cols - 1, Math.floor((pulse.x + ringR + band - offX) / p.cellSize));
        const minRow = Math.max(0, Math.floor((pulse.y - ringR - band - offY) / p.cellSize));
        const maxRow = Math.min(rows - 1, Math.floor((pulse.y + ringR + band - offY) / p.cellSize));
        for (let cRow = minRow; cRow <= maxRow; cRow++) {
          for (let cCol = minCol; cCol <= maxCol; cCol++) {
            const i = cRow * cols + cCol;
            const [cx, cy] = cellCenter(i);
            const dist = Math.hypot(cx - pulse.x, cy - pulse.y);
            if (Math.abs(dist - ringR) < band / 2 && p.maxOpacity > alphas[i]) {
              alphas[i] = p.maxOpacity;
              touched[i] = now;
            }
          }
        }
      }

      let anyVisible = pulses.length > 0;
      const fadeStep = dt / Math.max(p.fadeDuration, 16);
      const half = p.cellSize / 2;

      for (let i = 0; i < alphas.length; i++) {
        let a = alphas[i];
        if (a <= 0) continue;
        if (now - touched[i] > p.holdTime) {
          a = Math.max(0, a - fadeStep);
          alphas[i] = a;
          if (a <= 0) continue;
        }
        anyVisible = true;

        const [cx, cy] = cellCenter(i);
        const gradient = ctx.createRadialGradient(cx, cy, half * 0.1, cx, cy, p.cellSize);
        gradient.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${a})`);
        gradient.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);

        const x = cx - half + 0.5;
        const y = cy - half + 0.5;
        const s = p.cellSize - 1;

        ctx.beginPath();
        if (p.cellRadius > 0 && typeof ctx.roundRect === "function") {
          ctx.roundRect(x, y, s, s, p.cellRadius);
        } else {
          ctx.rect(x, y, s, s);
        }
        if (p.fillOpacity > 0) {
          ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${a * p.fillOpacity})`;
          ctx.fill();
        }
        ctx.strokeStyle = gradient;
        ctx.lineWidth = p.lineWidth;
        ctx.stroke();
      }

      if (anyVisible) {
        raf = requestAnimationFrame(draw);
      } else {
        running = false;
        // Keep the faint static lattice on screen; clear only hover glow.
        if (p.gridOpacity <= 0) ctx.clearRect(0, 0, w, h);
        else {
          // Repaint static lattice once so it survives the sleep.
          ctx.clearRect(0, 0, w, h);
          ctx.strokeStyle = `rgba(${hexToRgb(p.color).join(", ")}, ${p.gridOpacity})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let cCol = 0; cCol <= cols; cCol++) {
            const x = Math.round(offX + cCol * p.cellSize) + 0.5;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
          }
          for (let cRow = 0; cRow <= rows; cRow++) {
            const y = Math.round(offY + cRow * p.cellSize) + 0.5;
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
          }
          ctx.stroke();
        }
      }
    };

    const wake = () => {
      if (running) return;
      running = true;
      lastFrame = performance.now();
      raf = requestAnimationFrame(draw);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (reduceMotion) return;
      energize(e.clientX, e.clientY);
      wake();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (reduceMotion || !p.clickPulse) return;
      pulses.push({ x: e.clientX, y: e.clientY, t0: performance.now() });
      wake();
    };

    const onResize = () => {
      rebuild();
      wake();
    };

    rebuild();
    wake(); // paint static lattice, then sleep

    if (!reduceMotion) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerdown", onPointerDown, { passive: true });
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
