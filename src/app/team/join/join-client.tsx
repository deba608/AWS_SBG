"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Loader2 } from "lucide-react";
import { allMembers, coordinators, domainLeads, opsTeam, teamLeads } from "@/data/team";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { key: "leadership", title: "Leadership", roles: [...new Set(teamLeads.map((m) => m.role))], names: teamLeads.map((m) => m.name) },
  { key: "domain", title: "Domain leads", roles: [...new Set(domainLeads.map((m) => m.role))], names: domainLeads.map((m) => m.name) },
  { key: "ops", title: "Events, PR & media", roles: [...new Set(opsTeam.map((m) => m.role))], names: opsTeam.map((m) => m.name) },
  { key: "coordinators", title: "Co-ordinators", roles: [...new Set(coordinators.map((m) => m.role))], names: coordinators.map((m) => m.name) },
];

function roleForName(name: string): string {
  return allMembers.find((m) => m.name === name)?.role ?? "";
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = src;
  });
}

function cropToSquareJpeg(
  img: HTMLImageElement,
  crop: { zoom: number; x: number; y: number; box: number },
): Promise<Blob> {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const S = crop.box > 0 ? crop.box : 300;
  const coverW = S * Math.max(1, iw / ih);
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 800;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable in this browser.");
  // Visible window in natural px: cover-fit base, then zoom + pan (x/y in screen px).
  const unit = iw / (coverW * crop.zoom); // natural px per screen px
  const vis = S * unit;
  const cx = iw / 2 - crop.x * unit;
  const cy = ih / 2 - crop.y * unit;
  const sx = Math.min(Math.max(cx - vis / 2, 0), Math.max(iw - vis, 0));
  const sy = Math.min(Math.max(cy - vis / 2, 0), Math.max(ih - vis, 0));
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

export default function JoinClient() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; role?: string; photo?: string }>({});
  const [apiError, setApiError] = useState("");
  const [status, setStatus] = useState<"form" | "busy" | "done">("form");
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0 });

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function pickFile(f: File | null) {
    setApiError("");
    if (!f) {
      setFile(null);
      return;
    }
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setErrors((e) => ({ ...e, photo: "Use a JPG, PNG or WebP photo." }));
      return;
    }
    if (f.size > MAX_BYTES) {
      setErrors((e) => ({ ...e, photo: "Photo too large (max 5MB)." }));
      return;
    }
    setErrors((e) => ({ ...e, photo: undefined }));
    setFile(f);
    setZoom(1);
    setPos({ x: 0, y: 0 });
    setNat(null);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      const url = URL.createObjectURL(f);
      void loadImage(url)
        .then((img) => setNat({ w: img.naturalWidth, h: img.naturalHeight }))
        .catch(() => {});
      return url;
    });
  }

  function boxSize(): number {
    return boxRef.current?.clientWidth ?? 0;
  }

  function onDragStart(e: React.PointerEvent) {
    if (!preview) return;
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

  function onDragEnd() {
    setDragging(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const fe: typeof errors = {};
    if (!name) fe.name = "Select your name from the team list.";
    else if (!roleForName(name)) fe.name = "Select your name from the team list.";
    if (!role) fe.role = "Select your position from the list.";
    if (!file || !preview) fe.photo = "Upload a clear front-facing photo.";
    setErrors(fe);
    if (Object.keys(fe).filter((k) => fe[k as keyof typeof fe]).length > 0) return;
    setStatus("busy");
    setApiError("");
    try {
      const img = await loadImage(preview);
      const blob = await cropToSquareJpeg(img, { zoom, x: pos.x, y: pos.y, box: boxSize() });
      const form = new FormData();
      form.set("name", name.trim());
      form.set("role", role);
      form.set("photo", new File([blob], "photo.jpg", { type: "image/jpeg" }));
      const res = await fetch("/api/team/submit", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        throw new Error(data.error ?? "Submit failed.");
      }
      setStatus("done");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Submit failed.");
      setStatus("form");
    }
  }

  if (status === "done") {
    return (
      <div className="rank-card space-y-3 p-5 text-center sm:p-6">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-400" aria-hidden />
        <h2 className="text-lg font-bold text-cream">Submitted for review</h2>
        <p className="mx-auto max-w-prose text-sm leading-relaxed text-fog">
          Admin will approve your photo and it appears on the team page instantly after approval.
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus("form");
            setName("");
            setRole("");
            setFile(null);
            setPreview("");
            setZoom(1);
            setPos({ x: 0, y: 0 });
            setNat(null);
            setErrors({});
            setApiError("");
          }}
          className="inline-flex min-h-[44px] items-center rounded-full border border-line px-6 py-2 text-sm text-fog hover:text-cream"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={submit} className="rank-card space-y-4 p-5 sm:p-6">
      <div>
        <label htmlFor="team-name" className="mb-1.5 block text-sm font-medium text-cream">
          Your name *
        </label>
        <select
          id="team-name"
          value={name}
          onChange={(e) => {
            const v = e.target.value;
            setName(v);
            const r = roleForName(v);
            if (r) setRole(r);
          }}
          aria-invalid={Boolean(errors.name)}
          className={cn(
            "min-h-[44px] w-full rounded-xl border bg-surface px-3 py-3 text-base text-cream focus:outline-none focus:ring-2 focus:ring-brand sm:text-sm",
            errors.name ? "border-red-400/70" : "border-line",
          )}
        >
          <option value="">Select your name…</option>
          {SECTIONS.map((s) => (
            <optgroup key={s.key} label={s.title}>
              {s.names.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </optgroup>
          ))}
        </select>
        {errors.name ? <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.name}</p> : null}
      </div>

      <div>
        <label htmlFor="team-role" className="mb-1.5 block text-sm font-medium text-cream">
          Position *
        </label>
        <select
          id="team-role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          aria-invalid={Boolean(errors.role)}
          className={cn(
            "min-h-[44px] w-full rounded-xl border bg-surface px-3 py-3 text-base text-cream focus:outline-none focus:ring-2 focus:ring-brand sm:text-sm",
            errors.role ? "border-red-400/70" : "border-line",
          )}
        >
          <option value="">Select your position…</option>
          {SECTIONS.map((s) => (
            <optgroup key={s.key} label={s.title}>
              {s.roles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </optgroup>
          ))}
        </select>
        {errors.role ? <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.role}</p> : null}
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-cream">Photo * — drag to crop, slider to zoom</span>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="w-full max-w-52 shrink-0">
            <div
              ref={boxRef}
              onPointerDown={onDragStart}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
              onPointerCancel={onDragEnd}
              className={cn(
                "relative aspect-square w-full overflow-hidden rounded-xl border border-dashed border-line bg-ink/60",
                preview ? "cursor-grab touch-none active:cursor-grabbing" : "hover:border-brand/60",
              )}
              role={preview ? "slider" : undefined}
              aria-label={preview ? "Crop photo: drag to reposition" : "Upload team photo"}
              aria-valuetext={preview ? `Zoom ${zoom.toFixed(1)}x` : undefined}
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Crop preview — drag to reposition"
                  draggable={false}
                  className="h-full w-full object-cover select-none"
                  style={{ transform: `translate(${pos.x / zoom}px, ${pos.y / zoom}px) scale(${zoom})` }}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center text-xs text-faint"
                >
                  <ImagePlus className="h-6 w-6" aria-hidden />
                  Tap to upload — then crop square
                </button>
              )}
            </div>
            {preview ? (
              <div className="mt-2 flex items-center gap-2">
                <label htmlFor="team-zoom" className="text-xs text-faint">Zoom</label>
                <input
                  id="team-zoom"
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
              </div>
            ) : null}
          </div>
          <div className="min-w-0 flex-1 text-xs leading-relaxed text-fog">
            <p>Perfect format: <span className="font-semibold text-cream">square 800×800 JPG</span>.</p>
            <p className="mt-1">Drag photo to position face in square, slider zooms. What you frame is what submits. Max 5MB.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex min-h-[44px] items-center rounded-full border border-line px-4 py-2 text-xs font-semibold text-fog hover:text-cream"
              >
                {preview ? "Change photo" : "Upload photo"}
              </button>
              {preview ? (
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setPos({ x: 0, y: 0 });
                  }}
                  className="inline-flex min-h-[44px] items-center rounded-full border border-line px-4 py-2 text-xs text-fog hover:text-cream"
                >
                  Reset crop
                </button>
              ) : null}
            </div>
            {file ? <p className="mt-1 truncate text-cream">{file.name}</p> : null}
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-label="Photo file"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
        {errors.photo ? <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.photo}</p> : null}
      </div>

      {apiError ? (
        <p role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
          {apiError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "busy"}
        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-black hover:bg-brandhover disabled:opacity-70"
      >
        {status === "busy" ? (<><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Processing photo…</>) : "Submit for approval"}
      </button>
      <p className="text-xs leading-relaxed text-faint">Admin reviews every submission. Approved photos show on the team page instantly.</p>
    </form>
  );
}
