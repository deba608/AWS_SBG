"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Loader2, X, ZoomIn } from "lucide-react";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = src;
  });
}

/**
 * Reusable square-crop editor popup. Google-Photos style: the frame is always
 * fully filled (cover) — drag/arrows to reposition, pinch/slider to zoom.
 * onSave receives the processed 800x800 JPEG blob.
 */

function clampPos(
  x: number,
  y: number,
  zoom: number,
  nat: { w: number; h: number } | null,
  box: number,
): { x: number; y: number } {
  if (!nat || box <= 0) return { x: 0, y: 0 };
  const coverW = box * Math.max(1, nat.w / nat.h);
  const coverH = box * Math.max(1, nat.h / nat.w);
  // Cover always fills frame — clamp keeps photo edges at/over frame edges.
  const maxX = Math.max(0, (coverW * zoom - box) / 2);
  const maxY = Math.max(0, (coverH * zoom - box) / 2);
  return { x: Math.min(Math.max(x, -maxX), maxX), y: Math.min(Math.max(y, -maxY), maxY) };
}

async function exportSquareJpeg(
  img: HTMLImageElement,
  crop: { zoom: number; x: number; y: number; box: number },
): Promise<Blob> {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const S = crop.box > 0 ? crop.box : 300;
  // Must mirror preview CSS: object-cover base + translate(x,y) then scale about center,
  // so effective on-screen shift is exactly (x, y) px at any zoom.
  const base = Math.max(S / iw, S / ih); // screen px per natural px at zoom 1
  const vis = S / (base * crop.zoom);
  const cx = iw / 2 - crop.x / base;
  const cy = ih / 2 - crop.y / base;
  // Cover always fills frame — window stays inside photo, no letterbox.
  const sx = Math.min(Math.max(cx - vis / 2, 0), Math.max(iw - vis, 0));
  const sy = Math.min(Math.max(cy - vis / 2, 0), Math.max(ih - vis, 0));
  const ix0 = Math.max(sx, 0);
  const iy0 = Math.max(sy, 0);
  const ix1 = Math.min(sx + vis, iw);
  const iy1 = Math.min(sy + vis, ih);
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 800;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable in this browser.");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 800, 800);
  if (ix1 > ix0 && iy1 > iy0) {
    ctx.drawImage(
      img,
      ix0, iy0, ix1 - ix0, iy1 - iy0,
      ((ix0 - sx) / vis) * 800, ((iy0 - sy) / vis) * 800,
      ((ix1 - ix0) / vis) * 800, ((iy1 - iy0) / vis) * 800,
    );
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Photo processing failed. Retry."))),
      "image/jpeg",
      0.85,
    );
  });
}

/**
 * Reusable square-crop editor popup. Drag / 2-finger pinch / arrows to move,
 * slider / pinch to zoom. onSave receives the processed 800x800 JPEG blob.
 */
export default function PhotoCropper({
  src,
  title = "Crop photo",
  onClose,
  onSave,
}: {
  src: string;
  title?: string;
  onClose: () => void;
  onSave: (blob: Blob) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const backdropDownRef = useRef(false);
  const lastDragEndRef = useRef(0);
  const dragRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0 });
  const dragActiveRef = useRef(false);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{
    initDist: number;
    initZoom: number;
    initMidX: number;
    initMidY: number;
    origX: number;
    origY: number;
  } | null>(null);
  // Refs mirror state for gesture handlers on window (no stale closures).
  const zoomRef = useRef(zoom);
  const natRef = useRef(nat);
  const posRef = useRef(pos);
  useEffect(() => {
    zoomRef.current = zoom;
    natRef.current = nat;
    posRef.current = pos;
  }, [zoom, nat, pos]);

  useEffect(() => {
    let live = true;
    void loadImage(src)
      .then((img) => {
        if (!live) return;
        setNat({ w: img.naturalWidth, h: img.naturalHeight });
        // Google-style: open frame-filling (cover), centered. Drag to frame face.
        setZoom(1);
        setPos({ x: 0, y: 0 });
      })
      .catch(() => {
        if (live) setError("Could not read that image.");
      });
    return () => {
      live = false;
    };
  }, [src]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function boxSize(): number {
    return boxRef.current?.clientWidth ?? 0;
  }

  function onPointerDown(e: React.PointerEvent) {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) {
      // Second finger down — switch to pinch mode.
      const [a, b] = [...pointersRef.current.values()];
      pinchRef.current = {
        initDist: Math.hypot(a.x - b.x, a.y - b.y),
        initZoom: zoomRef.current,
        initMidX: (a.x + b.x) / 2,
        initMidY: (a.y + b.y) / 2,
        origX: posRef.current.x,
        origY: posRef.current.y,
      };
      dragActiveRef.current = false;
      return;
    }
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: posRef.current.x, origY: posRef.current.y };
    dragActiveRef.current = true;
  }

  // Gesture listeners stay mounted for the popup lifetime — moves tracked on
  // window so fast swipes and 2-finger pinches never drop mid-gesture.
  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!pointersRef.current.has(e.pointerId)) return;
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointersRef.current.size === 2) {
        // Pinch: spread = zoom, midpoint shift = move.
        const pinch = pinchRef.current;
        if (!pinch || pinch.initDist <= 0) return;
        const [a, b] = [...pointersRef.current.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        const z = Math.min(Math.max(pinch.initZoom * (dist / pinch.initDist), 1), 3);
        setZoom(z);
        setPos(
          clampPos(
            pinch.origX + (midX - pinch.initMidX),
            pinch.origY + (midY - pinch.initMidY),
            z,
            natRef.current,
            boxRef.current?.clientWidth ?? 0,
          ),
        );
        return;
      }
      if (!dragActiveRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (dx !== 0 || dy !== 0) lastDragEndRef.current = Date.now();
      setPos(
        clampPos(
          dragRef.current.origX + dx,
          dragRef.current.origY + dy,
          zoomRef.current,
          natRef.current,
          boxRef.current?.clientWidth ?? 0,
        ),
      );
    }
    function onUp(e: PointerEvent) {
      if (!pointersRef.current.has(e.pointerId)) return;
      pointersRef.current.delete(e.pointerId);
      if (pointersRef.current.size < 2) pinchRef.current = null;
      if (pointersRef.current.size === 1) {
        // One finger left — hand drag over to it so motion stays smooth.
        const [p] = [...pointersRef.current.values()];
        dragRef.current = { startX: p.x, startY: p.y, origX: posRef.current.x, origY: posRef.current.y };
        dragActiveRef.current = true;
      } else {
        dragActiveRef.current = false;
      }
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  function nudge(dx: number, dy: number) {
    setPos((p) => clampPos(p.x + dx, p.y + dy, zoomRef.current, natRef.current, boxSize()));
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const img = await loadImage(src);
      const blob = await exportSquareJpeg(img, { zoom, x: pos.x, y: pos.y, box: boxSize() });
      onSave(blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Crop failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      ref={backdropRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onPointerDown={(e) => {
        backdropDownRef.current = e.target === e.currentTarget;
      }}
      onClick={() => {
        // Never close from a drag that ends off-frame — only a clean backdrop tap.
        if (!backdropDownRef.current) return;
        if (Date.now() - lastDragEndRef.current < 400) return;
        onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-line bg-surface p-4 sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-cream">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close crop editor"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-fog hover:text-cream"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-fog">
          Drag with finger to move · pinch with 2 fingers to zoom · arrows nudge · frame stays full, square 800×800 output.
        </p>
        <div
          ref={boxRef}
          onPointerDown={onPointerDown}
          className="relative mt-3 aspect-square w-full cursor-grab touch-none overflow-hidden rounded-xl border border-line bg-black active:cursor-grabbing"
          aria-label="Crop area: drag to reposition photo"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt="Crop preview"
            draggable={false}
            className="h-full w-full object-cover select-none"
            style={{ transform: `translate(${pos.x / zoom}px, ${pos.y / zoom}px) scale(${zoom})` }}
          />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <ZoomIn className="h-4 w-4 shrink-0 text-faint" aria-hidden />
          <label htmlFor="crop-zoom" className="sr-only">Zoom</label>
          <input
            id="crop-zoom"
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => {
              const z = Number(e.target.value);
              setZoom(z);
              setPos((p) => clampPos(p.x, p.y, z, nat, boxSize()));
            }}
            className="min-h-[44px] w-full accent-purple-500"
          />
          <span className="w-10 shrink-0 text-right font-mono text-xs text-fog">{zoom.toFixed(1)}x</span>
        </div>
        <div className="mt-1 flex items-center justify-center gap-2" aria-label="Move photo with buttons">
          <button type="button" onClick={() => nudge(-12, 0)} aria-label="Move left" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-fog hover:text-cream">
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </button>
          <button type="button" onClick={() => nudge(0, -12)} aria-label="Move up" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-fog hover:text-cream">
            <ArrowUp className="h-4 w-4" aria-hidden />
          </button>
          <button type="button" onClick={() => nudge(0, 12)} aria-label="Move down" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-fog hover:text-cream">
            <ArrowDown className="h-4 w-4" aria-hidden />
          </button>
          <button type="button" onClick={() => nudge(12, 0)} aria-label="Move right" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-fog hover:text-cream">
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
        {error ? (
          <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>
        ) : null}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPos({ x: 0, y: 0 });
            }}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full border border-line px-4 py-2 text-sm text-fog hover:text-cream"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-bold text-black hover:bg-brandhover disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
            Use this crop
          </button>
        </div>
      </div>
    </div>
  );
}
