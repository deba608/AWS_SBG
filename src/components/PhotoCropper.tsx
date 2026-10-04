"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, X, ZoomIn } from "lucide-react";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = src;
  });
}

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
  const coverW = S * Math.max(1, iw / ih);
  const unit = iw / (coverW * crop.zoom);
  const vis = S * unit;
  const cx = iw / 2 - crop.x * unit;
  const cy = ih / 2 - crop.y * unit;
  const sx = Math.min(Math.max(cx - vis / 2, 0), Math.max(iw - vis, 0));
  const sy = Math.min(Math.max(cy - vis / 2, 0), Math.max(ih - vis, 0));
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 800;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable in this browser.");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 800, 800);
  ctx.drawImage(img, sx, sy, vis, vis, 0, 0, 800, 800);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Photo processing failed. Retry."))),
      "image/jpeg",
      0.85,
    );
  });
}

/**
 * Reusable square-crop editor popup. Drag to move, slider to zoom.
 * onSave receives the processed 800x800 JPEG blob.
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
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0 });

  useEffect(() => {
    let live = true;
    void loadImage(src)
      .then((img) => {
        if (live) setNat({ w: img.naturalWidth, h: img.naturalHeight });
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

  function onDragStart(e: React.PointerEvent) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onDragMove(e: React.PointerEvent) {
    if (!dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos(clampPos(dragRef.current.origX + dx, dragRef.current.origY + dy, zoom, nat, boxSize()));
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
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
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
          Drag to move position · slider to zoom · square 800×800 output.
        </p>
        <div
          ref={boxRef}
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          className="relative mt-3 aspect-square w-full cursor-grab touch-none overflow-hidden rounded-xl border border-line bg-ink/60 active:cursor-grabbing"
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
            step={0.1}
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
