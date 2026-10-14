"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Loader2, Minus, Plus, X, ZoomIn } from "lucide-react";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = src;
  });
}

/**
 * Resolve any crop source (data URL, blob URL, site path) into something
 * <img> can always display. Direct load first; on failure re-encode via
 * createImageBitmap + canvas to plain JPEG (fixes CMYK / odd-header /
 * orientation cases for manual admin re-crops of stored photos).
 */
async function resolveCropSrc(src: string): Promise<{ url: string; revoke: () => void }> {
  try {
    await loadImage(src);
    return { url: src, revoke: () => {} };
  } catch {
    // fall through to normalize
  }
  const res = await fetch(src).catch(() => null);
  if (!res || !res.ok) throw new Error("Could not read that image.");
  const blob = await res.blob().catch(() => null);
  if (!blob) throw new Error("Could not read that image.");
  let bmp: ImageBitmap | null = null;
  if (typeof createImageBitmap === "function") {
    try {
      bmp = await createImageBitmap(blob, { imageOrientation: "from-image" }).catch(() => createImageBitmap(blob));
    } catch {
      bmp = null;
    }
  }
  if (!bmp) throw new Error("Could not read that image.");
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not read that image.");
    ctx.drawImage(bmp, 0, 0);
    const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!jpeg) throw new Error("Could not read that image.");
    const url = URL.createObjectURL(jpeg);
    return { url, revoke: () => URL.revokeObjectURL(url) };
  } finally {
    bmp.close();
  }
}

/**
 * Reusable square-crop editor popup. Google-Photos style: the frame is always
 * fully filled (cover) — drag/arrows to reposition, pinch/slider to zoom.
 * onSave receives the processed 800x800 JPEG blob.
 */

/**
 * Single source of truth for all crop geometry. Rendered photo size and offset
 * are computed in plain pixels — no object-fit, no transform-origin — so the
 * preview, the drag clamp and the JPEG export can never disagree (that
 * disagreement is what exposed the black background when dragging).
 */
function viewGeometry(
  nat: { w: number; h: number },
  box: number,
  zoom: number,
  x: number,
  y: number,
): { rw: number; rh: number; left: number; top: number } {
  const r = nat.w / nat.h;
  const cw = box * Math.max(1, r);
  const ch = box * Math.max(1, 1 / r);
  const rw = cw * zoom;
  const rh = ch * zoom;
  return { rw, rh, left: (box - rw) / 2 + x, top: (box - rh) / 2 + y };
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

function clampZoom(z: number): number {
  if (!Number.isFinite(z)) return MIN_ZOOM;
  return Math.min(Math.max(z, MIN_ZOOM), MAX_ZOOM);
}

function clampPos(
  x: number,
  y: number,
  zoom: number,
  nat: { w: number; h: number } | null,
  box: number,
): { x: number; y: number } {
  if (!nat || box <= 0) return { x: 0, y: 0 };
  const { rw, rh } = viewGeometry(nat, box, zoom, 0, 0);
  // Offset range that keeps every frame edge covered by photo — drag stops
  // dead at the edge, background can never show through.
  const maxX = Math.max(0, (rw - box) / 2);
  const maxY = Math.max(0, (rh - box) / 2);
  return { x: Math.min(Math.max(x, -maxX), maxX), y: Math.min(Math.max(y, -maxY), maxY) };
}

async function exportSquareJpeg(
  img: HTMLImageElement,
  view: { natW: number; natH: number; box: number; zoom: number; x: number; y: number },
): Promise<Blob> {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const S = view.box > 0 ? view.box : 300;
  // Same geometry as preview: rendered photo rect → visible window in natural px.
  const { rw, rh, left, top } = viewGeometry({ w: view.natW, h: view.natH }, S, view.zoom, view.x, view.y);
  const kx = rw / iw;
  const ky = rh / ih;
  const visW = S / kx;
  const visH = S / ky;
  const sx = Math.min(Math.max(-left / kx, 0), Math.max(iw - visW, 0));
  const sy = Math.min(Math.max(-top / ky, 0), Math.max(ih - visH, 0));
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 800;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable in this browser.");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 800, 800);
  ctx.drawImage(img, sx, sy, visW, visH, 0, 0, 800, 800);
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
  const [decSrc, setDecSrc] = useState<string>(src);
  const [boxW, setBoxW] = useState(0);
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
  const boxWRef = useRef(0);
  useEffect(() => {
    zoomRef.current = zoom;
    natRef.current = nat;
    posRef.current = pos;
  }, [zoom, nat, pos]);
  useEffect(() => {
    boxWRef.current = boxW;
  }, [boxW]);

  useEffect(() => {
    let live = true;
    let revoke = () => {};
    // New photo → drop stale size/pos at once so clamp can't use old aspect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNat(null);
    setDecSrc(src);
    setZoom(1);
    setPos({ x: 0, y: 0 });
    setError("");
    void resolveCropSrc(src)
      .then(({ url, revoke: rv }) => {
        if (!live) {
          rv();
          return;
        }
        revoke = rv;
        setDecSrc(url);
        return loadImage(url);
      })
      .then((img) => {
        if (!live || !img) return;
        setNat({ w: img.naturalWidth, h: img.naturalHeight });
        // Google-style: open frame-filling (cover), centered. Drag to frame face.
      })
      .catch(() => {
        if (live) {
          setError(
            src.startsWith("blob:")
              ? "The selected photo expired. Close and choose the file again."
              : "Couldn't load this photo for cropping. Upload it again as a JPG.",
          );
          console.warn("[cropper] decode failed", { len: src.length, head: src.slice(0, 48) });
        }
      });
    return () => {
      live = false;
      revoke();
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
    if (boxW > 0) return boxW;
    if (boxWRef.current > 0) return boxWRef.current;
    return boxRef.current?.clientWidth ?? 0;
  }

  function currentBox(): number {
    return boxWRef.current > 0 ? boxWRef.current : (boxRef.current?.clientWidth ?? 0);
  }

  // Single zoom path for slider, +/- buttons and pinch — clamp zoom first,
  // then re-clamp pan so frame stays full. Rounds to kill float drift
  // between pinch (continuous) and slider/buttons (stepped).
  function applyZoom(raw: number) {
    const z = clampZoom(Math.round(raw * 1000) / 1000);
    zoomRef.current = z;
    setZoom(z);
    const box = currentBox();
    const natNow = natRef.current;
    setPos((p) => clampPos(p.x, p.y, z, natNow, box));
  }

  // Track frame width so preview geometry uses the real laid-out size.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setBoxW(el.clientWidth);
    measure();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    } else {
      window.addEventListener("resize", measure);
    }
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

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
        const z = clampZoom(pinch.initZoom * (dist / pinch.initDist));
        zoomRef.current = z;
        setZoom(z);
        const box = boxWRef.current > 0 ? boxWRef.current : (boxRef.current?.clientWidth ?? 0);
        setPos(
          clampPos(
            pinch.origX + (midX - pinch.initMidX),
            pinch.origY + (midY - pinch.initMidY),
            z,
            natRef.current,
            box,
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
          boxWRef.current > 0 ? boxWRef.current : (boxRef.current?.clientWidth ?? 0),
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

  function nudge(dirX: number, dirY: number) {
    // Adaptive step: fixed 12px felt dead on large frames, jumpy on small.
    // One frame-width / 20, bounded so arrows always move visibly.
    const box = boxSize();
    const step = Math.min(Math.max(box > 0 ? box / 20 : 12, 8), 32);
    setPos((p) => clampPos(p.x + dirX * step, p.y + dirY * step, zoomRef.current, natRef.current, box));
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const img = await loadImage(decSrc);
      const blob = await exportSquareJpeg(img, {
        natW: img.naturalWidth,
        natH: img.naturalHeight,
        box: boxSize(),
        zoom,
        x: pos.x,
        y: pos.y,
      });
      onSave(blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Crop failed.");
    } finally {
      setSaving(false);
    }
  }

  const S = boxW;
  const geo = nat && S > 0 ? viewGeometry(nat, S, zoom, pos.x, pos.y) : null;

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
          Drag to position. Slider or pinch to zoom. Output is a square JPG.
        </p>
        <div
          ref={boxRef}
          onPointerDown={onPointerDown}
          className="relative mt-3 aspect-square w-full cursor-grab touch-none overflow-hidden rounded-xl border border-line bg-black active:cursor-grabbing"
          aria-label="Crop area: drag to reposition photo"
        >
          {geo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={decSrc}
              alt="Crop preview"
              draggable={false}
              className="absolute top-0 left-0 max-w-none select-none"
              style={{ width: `${geo.rw}px`, height: `${geo.rh}px`, maxWidth: "none", maxHeight: "none", transform: `translate(${geo.left}px, ${geo.top}px)` }}
            />
          ) : null}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <ZoomIn className="h-4 w-4 shrink-0 text-faint" aria-hidden />
          <button
            type="button"
            onClick={() => applyZoom(zoomRef.current - ZOOM_STEP)}
            disabled={zoom <= MIN_ZOOM + 1e-6}
            aria-label="Zoom out"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-fog hover:text-cream disabled:opacity-40"
          >
            <Minus className="h-4 w-4" aria-hidden />
          </button>
          <label htmlFor="crop-zoom" className="sr-only">Zoom</label>
          <input
            id="crop-zoom"
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.05}
            value={zoom}
            onChange={(e) => applyZoom(Number(e.target.value))}
            className="min-h-[44px] w-full min-w-0 flex-1 accent-zinc-200"
          />
          <button
            type="button"
            onClick={() => applyZoom(zoomRef.current + ZOOM_STEP)}
            disabled={zoom >= MAX_ZOOM - 1e-6}
            aria-label="Zoom in"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-fog hover:text-cream disabled:opacity-40"
          >
            <Plus className="h-4 w-4" aria-hidden />
          </button>
          <span className="w-10 shrink-0 text-right font-mono text-xs text-fog">{zoom.toFixed(1)}x</span>
        </div>
        <div className="mt-1 flex items-center justify-center gap-2" aria-label="Move photo with buttons">
          <button type="button" onClick={() => nudge(-1, 0)} aria-label="Move left" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-fog hover:text-cream">
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </button>
          <button type="button" onClick={() => nudge(0, -1)} aria-label="Move up" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-fog hover:text-cream">
            <ArrowUp className="h-4 w-4" aria-hidden />
          </button>
          <button type="button" onClick={() => nudge(0, 1)} aria-label="Move down" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-fog hover:text-cream">
            <ArrowDown className="h-4 w-4" aria-hidden />
          </button>
          <button type="button" onClick={() => nudge(1, 0)} aria-label="Move right" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-fog hover:text-cream">
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
            disabled={saving || !nat}
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
