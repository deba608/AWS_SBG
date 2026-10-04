"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Loader2, Crop } from "lucide-react";
import { allMembers, coordinators, domainLeads, opsTeam, teamLeads } from "@/data/team";
import PhotoCropper from "@/components/PhotoCropper";
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
/** Downscale full photo to ~1280px JPEG so admin can re-crop from scratch later. */
const ORIGINAL_MAX_SIDE = 1280;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = src;
  });
}

function boundOriginal(img: HTMLImageElement): Promise<Blob> {
  const scale = Math.min(1, ORIGINAL_MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable in this browser.");
  ctx.drawImage(img, 0, 0, w, h);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Photo processing failed. Retry."))),
      "image/jpeg",
      0.82,
    );
  });
}

export default function JoinClient() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [originalUrl, setOriginalUrl] = useState("");
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; role?: string; photo?: string }>({});
  const [apiError, setApiError] = useState("");
  const [status, setStatus] = useState<"form" | "busy" | "done">("form");
  const inputRef = useRef<HTMLInputElement>(null);

  // Revoke each object URL independently so changing one doesn't revoke the other.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
    };
  }, [originalUrl]);

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
    if (preview) URL.revokeObjectURL(preview);
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setFile(null);
    setPreview("");
    setOriginalFile(null);
    setOriginalUrl("");
    // Build bounded full original first — editor opens on THAT, so full
    // photo (head included) comes before any crop.
    setPreparing(true);
    const rawUrl = URL.createObjectURL(f);
    void loadImage(rawUrl)
      .then((img) => boundOriginal(img))
      .then((blob) => {
        URL.revokeObjectURL(rawUrl);
        const bounded = new File([blob], "original.jpg", { type: "image/jpeg" });
        setOriginalFile(bounded);
        setOriginalUrl(URL.createObjectURL(bounded));
        setEditorOpen(true);
      })
      .catch((err) => {
        URL.revokeObjectURL(rawUrl);
        setErrors((e) => ({ ...e, photo: err instanceof Error ? err.message : "Could not read that image." }));
      })
      .finally(() => setPreparing(false));
  }

  function onCropSave(blob: Blob) {
    const cropped = new File([blob], "photo.jpg", { type: "image/jpeg" });
    if (preview) URL.revokeObjectURL(preview);
    setFile(cropped);
    setPreview(URL.createObjectURL(cropped));
    setEditorOpen(false);
    setErrors((e) => ({ ...e, photo: undefined }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const fe: typeof errors = {};
    if (!name) fe.name = "Select your name from the team list.";
    else if (!roleForName(name)) fe.name = "Select your name from the team list.";
    if (!role) fe.role = "Select your position from the list.";
    const photoFile = file;
    const fullFile = originalFile;
    if (!photoFile || !preview) fe.photo = "Upload a photo and finish cropping.";
    setErrors(fe);
    if (Object.keys(fe).filter((k) => fe[k as keyof typeof fe]).length > 0) return;
    if (!photoFile) return;
    setStatus("busy");
    setApiError("");
    try {
      const form = new FormData();
      form.set("name", name.trim());
      form.set("role", role);
      form.set("photo", photoFile, "photo.jpg");
      if (fullFile) form.set("original", fullFile, "original.jpg");
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
            setOriginalUrl("");
            setOriginalFile(null);
            setEditorOpen(false);
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
        <span className="mb-1.5 block text-sm font-medium text-cream">Photo * — crop popup opens on upload</span>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="w-full max-w-52 shrink-0">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-dashed border-line bg-ink/60">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Cropped square photo" className="h-full w-full object-cover" />
              ) : preparing ? (
                <span className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center text-xs text-faint">
                  <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
                  Loading full photo…
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center text-xs text-faint hover:text-cream"
                >
                  <ImagePlus className="h-6 w-6" aria-hidden />
                  Tap to upload — full photo opens first
                </button>
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1 text-xs leading-relaxed text-fog">
            <p>Perfect format: <span className="font-semibold text-cream">square 800×800 JPG</span>.</p>
            <p className="mt-1">Upload opens crop popup — drag to move position, slider to zoom, then Use this crop.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex min-h-[44px] items-center rounded-full border border-line px-4 py-2 text-xs font-semibold text-fog hover:text-cream"
              >
                {preview ? "Change photo" : "Upload photo"}
              </button>
              {originalUrl ? (
                <button
                  type="button"
                  onClick={() => setEditorOpen(true)}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-brand/60 bg-brand/10 px-4 py-2 text-xs font-semibold text-cream hover:bg-brand/20"
                >
                  <Crop className="h-3.5 w-3.5" aria-hidden />
                  Re-crop
                </button>
              ) : null}
            </div>
            {file ? <p className="mt-1 truncate text-cream">Cropped 800×800 ready</p> : null}
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
        {status === "busy" ? (<><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Submitting…</>) : "Submit for approval"}
      </button>
      <p className="text-xs leading-relaxed text-faint">Admin reviews every submission. Approved photos show on the team page instantly.</p>
      {editorOpen && originalUrl ? (
        <PhotoCropper
          src={originalUrl}
          title="Crop team photo"
          onClose={() => setEditorOpen(false)}
          onSave={onCropSave}
        />
      ) : null}
    </form>
  );
}
