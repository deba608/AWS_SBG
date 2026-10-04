import { NextResponse } from "next/server";
import {
  MAX_PHOTO_DATAURL_CHARS,
  TeamSubmissionError,
  createSubmission,
  sectionForRole,
} from "@/lib/team-store";
import { clientIp, rateOk } from "@/lib/rate-limit";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

export async function POST(req: Request) {
  if (!rateOk(`team-submit:${clientIp(req)}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Wait a minute." }, { status: 429 });
  }
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }
  const name = String(form.get("name") ?? "");
  const role = String(form.get("role") ?? "");
  const photo = form.get("photo");

  if (!sectionForRole(role)) {
    return NextResponse.json({ error: "Validation failed.", errors: { role: "Select your position from the list." } }, { status: 400 });
  }
  if (!(photo instanceof File)) {
    return NextResponse.json({ error: "Validation failed.", errors: { photo: "Photo is required." } }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(photo.type) || photo.type !== "image/jpeg") {
    return NextResponse.json(
      { error: "Validation failed.", errors: { photo: "Photo must be a square JPG — use the on-page cropper." } },
      { status: 400 },
    );
  }
  if (photo.size <= 0 || photo.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "Validation failed.", errors: { photo: "Photo too large (max 5MB before processing)." } },
      { status: 400 },
    );
  }
  const bytes = new Uint8Array(await photo.arrayBuffer());
  if (!isJpeg(bytes)) {
    return NextResponse.json(
      { error: "Validation failed.", errors: { photo: "Photo must be a square JPG — use the on-page cropper." } },
      { status: 400 },
    );
  }
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  const photoDataUrl = `data:image/jpeg;base64,${btoa(binary)}`;
  if (photoDataUrl.length > MAX_PHOTO_DATAURL_CHARS) {
    return NextResponse.json(
      { error: "Validation failed.", errors: { photo: "Photo too large after processing. Retry." } },
      { status: 400 },
    );
  }
  try {
    const sub = await createSubmission({ name, role, photoDataUrl });
    return NextResponse.json({ id: sub.id, status: sub.status }, { status: 201 });
  } catch (err) {
    if (err instanceof TeamSubmissionError) {
      return NextResponse.json({ error: "Validation failed.", errors: err.errors }, { status: 400 });
    }
    console.error("[team/submit]", err);
    return NextResponse.json({ error: "Submit failed. Retry." }, { status: 500 });
  }
}
