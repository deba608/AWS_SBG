import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listSubmissions, setSubmissionStatus, updateSubmissionPhoto, type SubmissionStatus } from "@/lib/team-store";

/** Admin: list all photo submissions, newest first. */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const submissions = await listSubmissions();
  const counts = {
    pending: submissions.filter((s) => s.status === "pending").length,
    approved: submissions.filter((s) => s.status === "approved").length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
  };
  return NextResponse.json({ submissions, counts });
}

/** Admin: PATCH { id, status } → approve / reject / reopen. Approved shows on /team instantly. */
export async function PATCH(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const id = String(b.id ?? "");
  if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });
  // Admin re-crop: PATCH { id, photoDataUrl } replaces the square JPG.
  if (typeof b.photoDataUrl === "string") {
    try {
      const submission = await updateSubmissionPhoto(id, b.photoDataUrl);
      return NextResponse.json({ submission });
    } catch (err) {
      if (err instanceof Error && err.message === "Submission not found.") {
        return NextResponse.json({ error: "Submission not found." }, { status: 404 });
      }
      return NextResponse.json({ error: err instanceof Error ? err.message : "Update failed." }, { status: 400 });
    }
  }
  const status = String(b.status ?? "") as SubmissionStatus;
  if (!id || !["pending", "approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "id and valid status required." }, { status: 400 });
  }
  try {
    const submission = await setSubmissionStatus(id, status);
    return NextResponse.json({ submission });
  } catch (err) {
    if (err instanceof Error && err.message === "Submission not found.") {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }
    console.error("[admin/team PATCH]", err);
    return NextResponse.json({ error: "Update failed. Retry." }, { status: 500 });
  }
}
