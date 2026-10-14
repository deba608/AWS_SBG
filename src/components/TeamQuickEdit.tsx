"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Crop, ImagePlus, Loader2, X } from "lucide-react";
import PhotoCropper from "./PhotoCropper";
import type { TeamMember } from "@/data/team";
import type { TeamSubmission } from "@/lib/team-store";
import { initials } from "@/lib/utils";

export interface QuickEditMeta {
  members: string[];
  roles: { role: string; section: string }[];
}

const SECTION_TITLES: Record<string, string> = {
  leadership: "Leadership",
  domain: "Technical & Domain Leads",
  ops: "Events, PR & media",
  coordinators: "Co-ordinators",
};

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const HEIC_TYPES = ["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"];
const MAX_BYTES = 5 * 1024 * 1024;
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

function fileFacts(f: File): string {
  const mb = f.size / (1024 * 1024);
  const size = mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB`;
  return `${f.name || "photo"} (${f.type || "unknown type"}, ${size})`;
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
async function decodeFile(f: File): Promise<{
  source: CanvasImageSource;
  w: number;
  h: number;
  close: () => void;
}> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(f, { imageOrientation: "from-image" }).catch(() => createImageBitmap(f));
      return { source: bmp, w: bmp.width, h: bmp.height, close: () => bmp.close() };
    } catch {
      // fall through to <img> decode
    }
  }
  const rawUrl = URL.createObjectURL(f);
  try {
    const img = await loadImage(rawUrl);
    return { source: img, w: img.naturalWidth, h: img.naturalHeight, close: () => {} };
  } finally {
    URL.revokeObjectURL(rawUrl);
  }
}

/**
 * Bounded JPEG blob from a decoded source. Re-encoding to plain JPG also
 * normalizes files <img> can't read (CMYK, odd headers) into something the
 * cropper always opens.
 */
function sourceToJpegBlob(
  source: CanvasImageSource,
  naturalW: number,
  naturalH: number,
): Promise<Blob> {
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

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read cropped photo."));
    reader.readAsDataURL(blob);
  });
}

/**
 * Admin quick-edit modal for direct modification from /team.
 * Edits name / role / links / photo on the approved record — live instantly.
 */
export default function TeamQuickEdit({
  member,
  submission,
  meta,
  onClose,
  onSaved,
}: {
  member: TeamMember;
  submission: TeamSubmission | null;
  meta: QuickEditMeta;
  onClose: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(submission?.name ?? member.name);
  const [role, setRole] = useState(submission?.role ?? member.role);
  const [linkedin, setLinkedin] = useState(submission?.linkedin ?? member.linkedin ?? "");
  const [github, setGithub] = useState(submission?.github ?? member.github ?? "");
  const [email, setEmail] = useState(submission?.email ?? member.email ?? "");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [originalUpload, setOriginalUpload] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const cropObjectUrl = useRef<string | null>(null);

  const livePhoto = submission?.photoDataUrl || member.photo || "";
  const preview = photoDataUrl ?? (livePhoto || null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !cropSrc) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      // Never revoke the crop blob here — this cleanup also runs when the
      // parent re-renders (new onClose identity), which killed the live
      // object URL mid-crop. Revoke belongs to unmount only (below).
    };
  }, [cropSrc, onClose]);

  // Unmount-only: release the crop object URL. Empty deps on purpose.
  useEffect(() => {
    return () => {
      if (cropObjectUrl.current) URL.revokeObjectURL(cropObjectUrl.current);
    };
  }, []);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError("");
    if (!ACCEPTED_TYPES.includes(file.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
      setError("Upload a JPG, PNG, WebP, or HEIC file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File must be under 5 MB.");
      return;
    }
    try {
      // HEIC (iPhone) can't be decoded by browsers — convert first. Then
      // decode via createImageBitmap (<img> alone can't read CMYK or
      // odd-header files), and feed the cropper a fresh JPEG blob so its
      // preview/export can never fail to load.
      const work = await coerceToJpegFile(file);
      const { source, w, h, close } = await decodeFile(work);
      try {
        const bounded = await sourceToJpegBlob(source, w, h);
        setOriginalUpload(await blobToDataUrl(bounded));
        if (cropObjectUrl.current) URL.revokeObjectURL(cropObjectUrl.current);
        const url = URL.createObjectURL(bounded);
        cropObjectUrl.current = url;
        setCropSrc(url);
      } finally {
        close();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not read that image.";
      setError(
        msg === "Could not read that image."
          ? `Couldn't open ${fileFacts(file)}. Upload a JPG, PNG, or WebP file.`
          : msg,
      );
    }
  }

  function openRecrop() {
    setError("");
    const src = submission?.originalDataUrl || submission?.photoDataUrl || member.photo || "";
    if (!src) {
      setError("No photo to re-crop — upload one first.");
      return;
    }
    setCropSrc(src);
  }

  async function onCropSave(blob: Blob) {
    try {
      const dataUrl = await blobToDataUrl(blob);
      setPhotoDataUrl(dataUrl);
      setCropSrc(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Crop failed.");
    }
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previousName: member.name,
          name: name.trim(),
          role,
          ...(photoDataUrl ? { photoDataUrl } : {}),
          ...(originalUpload ? { originalDataUrl: originalUpload } : {}),
          linkedin: linkedin.trim(),
          github: github.trim(),
          email: email.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not save. Retry.");
        return;
      }
      onSaved();
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${member.name}`}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="my-auto w-full max-w-md rounded-2xl border border-line bg-surface p-4 sm:p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-cream">Edit member</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close editor"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-fog hover:text-cream"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-fog">
          Changes go live when saved.
        </p>

        <div className="mt-3 flex items-center gap-3">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={name} className="h-20 w-20 shrink-0 rounded-xl border border-line object-cover" />
          ) : (
            <div aria-hidden className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-line bg-white/5 text-xl font-bold text-cream">
              {initials(name)}
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-line px-4 py-2 text-xs font-semibold text-fog hover:text-cream"
            >
              <ImagePlus className="h-4 w-4" aria-hidden /> {livePhoto ? "Change photo" : "Upload photo"}
            </button>
            {livePhoto ? (
              <button
                type="button"
                onClick={openRecrop}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-line px-4 py-2 text-xs font-semibold text-fog hover:text-cream"
              >
                <Crop className="h-4 w-4" aria-hidden /> Adjust crop
              </button>
            ) : null}
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={[...ACCEPTED_TYPES, ".heic", ".heif"].join(",")}
          className="hidden"
          aria-hidden
          tabIndex={-1}
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        <div className="mt-3 space-y-2">
          <label className="block text-xs text-fog">
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              list="team-quickedit-names"
              className="mt-1 min-h-[44px] w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-cream"
            />
          </label>
          <label className="block text-xs text-fog">
            Position
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-cream"
            >
              {meta.roles.length === 0 ? <option value={role}>{role}</option> : null}
              {Object.keys(SECTION_TITLES)
                .filter((sec) => meta.roles.some((o) => o.section === sec))
                .map((sec) => (
                  <optgroup key={sec} label={SECTION_TITLES[sec]}>
                    {meta.roles
                      .filter((o) => o.section === sec)
                      .map((o) => (
                        <option key={o.role} value={o.role}>{o.role}</option>
                      ))}
                  </optgroup>
                ))}
            </select>
          </label>
          <label className="block text-xs text-fog">
            LinkedIn
            <input
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="linkedin.com/in/…"
              className="mt-1 min-h-[44px] w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-cream"
            />
          </label>
          <label className="block text-xs text-fog">
            GitHub
            <input
              type="url"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="github.com/…"
              className="mt-1 min-h-[44px] w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-cream"
            />
          </label>
          <label className="block text-xs text-fog">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 min-h-[44px] w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-cream"
            />
          </label>
        </div>
        <datalist id="team-quickedit-names">
          {meta.members.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>

        {error ? <p role="alert" className="mt-2 text-xs text-red-300">{error}</p> : null}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full border border-line px-4 py-2 text-sm text-fog hover:text-cream"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-bold text-black hover:bg-brandhover disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
            Save
          </button>
        </div>
      </div>
      {cropSrc ? (
        <PhotoCropper
          src={cropSrc}
          title={`Crop — ${name}`}
          onClose={() => setCropSrc(null)}
          onSave={onCropSave}
        />
      ) : null}
    </div>
  );
}
