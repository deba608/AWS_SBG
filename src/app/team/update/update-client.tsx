"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Loader2, Crop } from "lucide-react";
import { allMembers, coordinators, domainLeads, opsTeam, teamLeads } from "@/data/team";
import PhotoCropper from "@/components/PhotoCropper";
import { cn, initials } from "@/lib/utils";

const SECTIONS = [
  { key: "leadership", title: "Leadership", names: teamLeads.map((m) => m.name) },
  { key: "domain", title: "Technical & Domain Leads", names: domainLeads.map((m) => m.name) },
  { key: "ops", title: "Events, PR & media", names: opsTeam.map((m) => m.name) },
  { key: "coordinators", title: "Co-ordinators", names: coordinators.map((m) => m.name) },
];

function roleForName(name: string): string {
  return allMembers.find((m) => m.name === name)?.role ?? "";
}

interface LiveMember {
  name: string;
  role: string;
  photo: string | null;
  linkedin: string | null;
  github: string | null;
  email: string | null;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const HEIC_TYPES = ["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"];
const MAX_BYTES = 5 * 1024 * 1024;
/** Downscale full photo to ~1280px JPEG so admin can re-crop from scratch later. */
const ORIGINAL_MAX_SIDE = 1280;

/** iPhones often send HEIC (sometimes .jpg-renamed) — detect via MIME, ext, or ftyp brand. */
async function isHeic(file: File): Promise<boolean> {
  if (HEIC_TYPES.includes((file.type || "").toLowerCase())) return true;
  if (/\.(heic|heif)$/i.test(file.name)) return true;
  try {
    const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    if (head.length >= 12 && head[4] === 0x66 && head[5] === 0x74 && head[6] === 0x79 && head[7] === 0x70) {
      const brand = String.fromCharCode(head[8], head[9], head[10], head[11]);
      return ["heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevt", "mif1", "msf1"].includes(brand);
    }
  } catch {
    // fall through — decode attempt reports the real error
  }
  return false;
}

/** Convert HEIC uploads to JPEG in-browser; passes everything else through untouched. */
async function coerceToJpegFile(file: File): Promise<File> {
  if (!(await isHeic(file))) return file;
  try {
    const { default: heic2any } = await import("heic2any");
    const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
    const blob = (Array.isArray(out) ? out[0] : out) as Blob;
    const base = file.name.replace(/\.(heic|heif)$/i, "") || "photo";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } catch {
    throw new Error("Couldn't convert this HEIC photo. Save it as a JPG and try again.");
  }
}

function withHttps(v: string): string {
  const t = v.trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

function normalizeEmail(v: string): string {
  return v.trim().toLowerCase();
}

function validateLinkFields(linkedin: string, github: string, email: string): { linkedin?: string; github?: string; email?: string } {
  const fe: { linkedin?: string; github?: string; email?: string } = {};
  const li = linkedin.trim();
  const gh = github.trim();
  const em = email.trim().toLowerCase();
  if (li) {
    const full = withHttps(li);
    try {
      const u = new URL(full);
      if (u.protocol !== "http:" && u.protocol !== "https:") fe.linkedin = "Enter a valid LinkedIn URL.";
      else if (!/linkedin\.com|lnkd\.in/i.test(full)) fe.linkedin = "That doesn't look like a LinkedIn URL.";
    } catch {
      fe.linkedin = "Enter a valid LinkedIn URL.";
    }
  }
  if (gh) {
    const full = withHttps(gh);
    try {
      const u = new URL(full);
      if (u.protocol !== "http:" && u.protocol !== "https:") fe.github = "Enter a valid GitHub URL.";
      else if (!/github\.com/i.test(full)) fe.github = "That doesn't look like a GitHub URL.";
    } catch {
      fe.github = "Enter a valid GitHub URL.";
    }
  }
  if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) fe.email = "Enter a valid email address.";
  return fe;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = src;
  });
}

/**
 * Decode an uploaded file for the cropper. Prefers createImageBitmap
 * (reads more formats, honors EXIF orientation); falls back to <img>.
 * Throws "Could not read that image." when neither can decode it.
 */
async function decodeFile(f: File): Promise<{ source: CanvasImageSource; w: number; h: number }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(f, { imageOrientation: "from-image" }).catch(() => createImageBitmap(f));
      return { source: bmp, w: bmp.width, h: bmp.height };
    } catch {
      // fall through to <img> decode
    }
  }
  const rawUrl = URL.createObjectURL(f);
  try {
    const img = await loadImage(rawUrl);
    return { source: img, w: img.naturalWidth, h: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(rawUrl);
  }
}

function boundOriginal(source: CanvasImageSource, naturalW: number, naturalH: number): Promise<Blob> {
  const scale = Math.min(1, ORIGINAL_MAX_SIDE / Math.max(naturalW, naturalH));
  const w = Math.max(1, Math.round(naturalW * scale));
  const h = Math.max(1, Math.round(naturalH * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable in this browser.");
  ctx.drawImage(source, 0, 0, w, h);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Photo processing failed. Retry."))),
      "image/jpeg",
      0.82,
    );
  });
}

export default function UpdateClient() {
  const [name, setName] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [originalUrl, setOriginalUrl] = useState("");
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; photo?: string; linkedin?: string; github?: string; email?: string }>({});
  const [apiError, setApiError] = useState("");
  const [status, setStatus] = useState<"form" | "busy" | "done">("form");
  const [wasUpdated, setWasUpdated] = useState(false);
  const [linksSameNote, setLinksSameNote] = useState(false);
  const [sentPhoto, setSentPhoto] = useState(true);
  const [live, setLive] = useState<LiveMember | null>(null);
  const [livePending, setLivePending] = useState(false);
  const [liveLoading, setLiveLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Position comes from the roster — no second dropdown to get wrong.
  const role = roleForName(name);

  // Progress checklist — same order as the form: name → photo → links → submit.
  // Photo required only for first-timers (no live photo yet); members with a
  // live photo can send a links-only update.
  const stepName = Boolean(name && role);
  const stepPhoto = Boolean(file && preview);
  const photoOptional = Boolean(live?.photo);
  const photoDone = stepPhoto || photoOptional;
  const stepLinks = [linkedin.trim(), github.trim(), email.trim()].filter(Boolean).length;
  const doneCount = (stepName ? 1 : 0) + (photoDone ? 1 : 0);

  // Links identical to what's already live → only the photo changes.
  const linksSameAsLive =
    live != null &&
    (live.linkedin ?? "") === (linkedin.trim() ? withHttps(linkedin) : "") &&
    (live.github ?? "") === (github.trim() ? withHttps(github) : "") &&
    (live.email ?? "") === normalizeEmail(email);

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

  function clearPhoto() {
    if (preview) URL.revokeObjectURL(preview);
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setFile(null);
    setPreview("");
    setOriginalFile(null);
    setOriginalUrl("");
    setEditorOpen(false);
  }

  function pickName(v: string) {
    setName(v);
    setApiError("");
    setErrors((e) => ({ ...e, name: undefined }));
    // Different person → drop the previous photo/links, then prefill from live.
    clearPhoto();
    setLinkedin("");
    setGithub("");
    setEmail("");
    setLive(null);
    setLivePending(false);
    if (!v) return;
    setLiveLoading(true);
    void fetch(`/api/team/member?name=${encodeURIComponent(v)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.member) return;
        const m = d.member as LiveMember;
        setLive(m);
        setLivePending(Boolean(d.hasPending));
        // Prefill editable links from live data — user edits only what changed.
        setLinkedin(m.linkedin ?? "");
        setGithub(m.github ?? "");
        setEmail(m.email ?? "");
      })
      .catch(() => undefined)
      .finally(() => setLiveLoading(false));
  }

  function pickFile(f: File | null) {
    setApiError("");
    if (!f) {
      setFile(null);
      return;
    }
    // Some phones/share-sheets send an empty MIME type — fall back to extension.
    const extOk = /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name);
    if (!ACCEPTED_TYPES.includes(f.type) && !extOk) {
      setErrors((e) => ({ ...e, photo: "Upload a JPG, PNG, WebP, or HEIC file." }));
      return;
    }
    if (f.size > MAX_BYTES) {
      setErrors((e) => ({ ...e, photo: "File must be under 5 MB." }));
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
    const picked = f;
    void coerceToJpegFile(picked)
      .then((work) => decodeFile(work))
      .then(({ source, w, h }) => boundOriginal(source, w, h))
      .then((blob) => {
        const bounded = new File([blob], "original.jpg", { type: "image/jpeg" });
        setOriginalFile(bounded);
        setOriginalUrl(URL.createObjectURL(bounded));
        setEditorOpen(true);
      })
      .catch((err) => {
        const kb = Math.max(1, Math.round(picked.size / 1024));
        const facts = `${picked.name || "photo"} (${picked.type || "unknown type"}, ${picked.size >= 1024 * 1024 ? `${(picked.size / (1024 * 1024)).toFixed(1)} MB` : `${kb} KB`})`;
        const msg = err instanceof Error ? err.message : "Could not read that image.";
        setErrors((e) => ({
          ...e,
          photo: msg === "Could not read that image." ? `Couldn't open ${facts}. Upload a JPG, PNG, or WebP file.` : msg,
        }));
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
    if (!name || !role) fe.name = "Select your name from the team list.";
    const photoFile = file;
    const fullFile = originalFile;
    const hasNewPhoto = Boolean(photoFile && preview);
    if (!hasNewPhoto && !live?.photo) fe.photo = "Upload a photo and finish cropping.";
    Object.assign(fe, validateLinkFields(linkedin, github, email));
    setErrors(fe);
    if (Object.keys(fe).filter((k) => fe[k as keyof typeof fe]).length > 0) return;
    // Nothing new at all → stop early instead of a no-op review row.
    if (!hasNewPhoto && live && linksSameAsLive) {
      setApiError("Nothing new — upload a photo or change a link, then submit.");
      return;
    }
    setStatus("busy");
    setApiError("");
    try {
      const form = new FormData();
      form.set("name", name.trim());
      if (photoFile) form.set("photo", photoFile, "photo.jpg");
      if (fullFile) form.set("original", fullFile, "original.jpg");
      // Links optional — same approval flow as photo. Server normalizes + validates.
      if (linkedin.trim()) form.set("linkedin", withHttps(linkedin));
      if (github.trim()) form.set("github", withHttps(github));
      if (email.trim()) form.set("email", normalizeEmail(email));
      const res = await fetch("/api/team/submit", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        throw new Error(data.error ?? "Submit failed.");
      }
      setWasUpdated(Boolean(data.updated));
      setLinksSameNote(Boolean(data.linksUnchanged));
      setSentPhoto(hasNewPhoto);
      setStatus("done");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Submit failed.");
      setStatus("form");
    }
  }

  function resetAll() {
    setStatus("form");
    pickName("");
    setFile(null);
    setPreview("");
    setOriginalUrl("");
    setOriginalFile(null);
    setEditorOpen(false);
    setErrors({});
    setApiError("");
    setWasUpdated(false);
    setLinksSameNote(false);
    setSentPhoto(true);
  }

  if (status === "done") {
    return (
      <div className="rank-card space-y-3 p-5 text-center sm:p-6">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-400" aria-hidden />
        <h2 className="text-lg font-bold text-cream">{wasUpdated ? "Pending request updated" : "Submitted for review"}</h2>
        <p className="mx-auto max-w-prose text-sm leading-relaxed text-fog">
          {wasUpdated
              ? "Your earlier pending request was replaced with this one."
              : sentPhoto
                ? "Your photo will appear on the team page after approval."
                : "Your links will appear on the team page after approval."}
          {linksSameNote ? " Links are unchanged, so only the photo updates." : null}
        </p>
        <button
          type="button"
          onClick={resetAll}
          className="inline-flex min-h-[44px] items-center rounded-full border border-line px-6 py-2 text-sm text-fog hover:text-cream"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={submit} className="rank-card space-y-4 p-5 sm:p-6">
      {/* Progress: name → photo → links. Photo optional when live photo exists. */}
      <ol aria-label="Progress" className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <li className={cn("rounded-full border px-3 py-1", stepName ? "border-green-400/60 text-green-300" : "border-line text-fog")}>
          {stepName ? "✓ " : "1 "} Name
        </li>
        <li className={cn("rounded-full border px-3 py-1", photoDone ? "border-green-400/60 text-green-300" : "border-line text-fog")}>
          {photoDone ? "✓ " : "2 "} Photo{photoOptional ? " (optional)" : ""}
        </li>
        <li className={cn("rounded-full border px-3 py-1", stepLinks > 0 ? "border-line text-cream" : "border-line text-fog")}>
          3 Links{stepLinks > 0 ? ` · ${stepLinks}` : " (optional)"}
        </li>
        <li className="ml-auto text-faint">{doneCount}/2 required done</li>
      </ol>
      <div>
        <label htmlFor="team-name" className="mb-1.5 block text-sm font-medium text-cream">
          Your name *
        </label>
        <select
          id="team-name"
          value={name}
          onChange={(e) => pickName(e.target.value)}
          aria-invalid={Boolean(errors.name)}
          className={cn(
            "min-h-[44px] w-full rounded-xl border bg-surface px-3 py-3 text-base text-cream focus:outline-none focus:ring-2 focus:ring-neutral-400 sm:text-sm",
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
        {role ? (
          <p className="mt-1.5 text-xs text-fog">
            Position (auto): <span className="font-semibold text-cream">{role}</span>
          </p>
        ) : null}
      </div>

      {/* What's already live — user edits only what changed. */}
      {liveLoading ? (
        <p className="flex items-center gap-2 text-xs text-faint" role="status">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Loading current profile…
        </p>
      ) : live ? (
        <div className="flex items-start gap-3 rounded-xl border border-line bg-ink/40 p-3">
          {live.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={live.photo} alt={`Current photo of ${live.name}`} className="h-14 w-14 shrink-0 rounded-lg object-cover" loading="lazy" />
          ) : (
            <div aria-hidden className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-line bg-coal text-sm font-bold text-cream">
              {initials(live.name)}
            </div>
          )}
          <div className="min-w-0 text-xs leading-relaxed text-fog">
            <p className="font-semibold text-cream">Currently live</p>
            <p className="truncate">
              {[
                live.photo && "Photo",
                live.linkedin && "LinkedIn",
                live.github && "GitHub",
                live.email && "Email",
              ]
                .filter(Boolean)
                .join(" · ") || "No photo or links yet"}
            </p>
            {livePending ? (
              <p className="mt-0.5 text-fog">Pending request exists — submitting replaces it.</p>
            ) : (
              <p className="mt-0.5 text-faint">Links below are prefilled — change only what&apos;s new.</p>
            )}
          </div>
        </div>
      ) : null}

      <div>
        <span className="mb-1.5 block text-sm font-medium text-cream">
          Photo{photoOptional ? "" : " *"}
        </span>
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
                  Tap to upload
                </button>
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1 text-xs leading-relaxed text-fog">
            <p>Square JPG, 800 × 800.</p>
            <p className="mt-1">After upload, drag to position and use the slider to zoom.</p>
            {photoOptional ? (
              <p className="mt-1">Live photo on file. Upload only to replace it.</p>
            ) : null}
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
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-line px-4 py-2 text-xs font-semibold text-fog hover:text-cream"
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
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
          className="sr-only"
          aria-label="Photo file"
          onChange={(e) => {
            pickFile(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
        {errors.photo ? <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.photo}</p> : null}
      </div>

      <fieldset className="rounded-xl border border-line p-4">
        <legend className="px-2 text-sm font-medium text-cream">Links — optional, same approval as photo</legend>
        <div className="space-y-3">
          <div>
            <label htmlFor="team-linkedin" className="mb-1.5 block text-sm font-medium text-cream">
              LinkedIn
            </label>
            <input
              id="team-linkedin"
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="linkedin.com/in/your-name"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              aria-invalid={Boolean(errors.linkedin)}
              className={cn(
                "min-h-[44px] w-full rounded-xl border bg-surface px-3 py-3 text-base text-cream placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-brand sm:text-sm",
                errors.linkedin ? "border-red-400/70" : "border-line",
              )}
            />
            {errors.linkedin ? <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.linkedin}</p> : null}
          </div>
          <div>
            <label htmlFor="team-github" className="mb-1.5 block text-sm font-medium text-cream">
              GitHub
            </label>
            <input
              id="team-github"
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="github.com/your-name"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              aria-invalid={Boolean(errors.github)}
              className={cn(
                "min-h-[44px] w-full rounded-xl border bg-surface px-3 py-3 text-base text-cream placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-brand sm:text-sm",
                errors.github ? "border-red-400/70" : "border-line",
              )}
            />
            {errors.github ? <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.github}</p> : null}
          </div>
          <div>
            <label htmlFor="team-email" className="mb-1.5 block text-sm font-medium text-cream">
              Email
            </label>
            <input
              id="team-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(errors.email)}
              className={cn(
                "min-h-[44px] w-full rounded-xl border bg-surface px-3 py-3 text-base text-cream placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-brand sm:text-sm",
                errors.email ? "border-red-400/70" : "border-line",
              )}
            />
            {errors.email ? <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.email}</p> : null}
          </div>
          <p className="text-xs leading-relaxed text-faint">
            Tip: paste full URL or just <span className="font-mono text-cream">linkedin.com/in/…</span> — https:// added for you. Leave blank to skip.
          </p>
          {live && linksSameAsLive ? (
            <p className="text-xs text-faint">Same links as live — only your new photo will change.</p>
          ) : null}
        </div>
      </fieldset>

      {apiError ? (
        <p role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
          {apiError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "busy" || preparing}
        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-black hover:bg-brandhover disabled:opacity-70"
      >
        {status === "busy" ? (<><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Submitting…</>) : livePending ? "Update pending request" : "Submit for approval"}
      </button>
      <p className="text-xs leading-relaxed text-faint">
        Admin reviews every submission. Approved {[stepPhoto ? "photo" : null, stepLinks > 0 ? "links" : null].filter(Boolean).join(" + ") || "changes"} show on the team page instantly.
      </p>
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
