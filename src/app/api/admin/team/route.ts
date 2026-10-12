import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { allMembers } from "@/data/team";
import { adminUpsertMember, deleteSubmission, listSubmissions, roleOptions, setSubmissionStatus, updateSubmissionDetails, updateSubmissionLinks, updateSubmissionPhoto, TeamSubmissionError, type SubmissionStatus } from "@/lib/team-store";

/** Admin: list all photo submissions, newest first. */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const submissions = await listSubmissions();
  const counts = {
    pending: submissions.filter((s) => s.status === "pending").length,
    approved: submissions.filter((s) => s.status === "approved").length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
  };
  return NextResponse.json({
    submissions,
    counts,
    meta: {
      members: allMembers.map((m) => m.name),
      roles: roleOptions(),
    },
  });
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
  // Admin full edit: PATCH { id, name?, role?, linkedin?, github?, email? }.
  // Renames, role changes (section derived) and link edits in one save.
  if ("name" in b || "role" in b) {
    try {
      const submission = await updateSubmissionDetails(id, {
        ...(typeof b.name === "string" ? { name: b.name } : {}),
        ...(typeof b.role === "string" ? { role: b.role } : {}),
        ...(typeof b.linkedin === "string" ? { linkedin: b.linkedin } : {}),
        ...(typeof b.github === "string" ? { github: b.github } : {}),
        ...(typeof b.email === "string" ? { email: b.email } : {}),
      });
      return NextResponse.json({ submission });
    } catch (err) {
      if (err instanceof Error && err.message === "Submission not found.") {
        return NextResponse.json({ error: "Submission not found." }, { status: 404 });
      }
      if (err instanceof TeamSubmissionError) {
        const first = Object.values(err.errors)[0];
        return NextResponse.json({ error: first ?? "Invalid details.", errors: err.errors }, { status: 400 });
      }
      return NextResponse.json({ error: err instanceof Error ? err.message : "Update failed." }, { status: 400 });
    }
  }
  // Admin edit links: PATCH { id, linkedin?, github?, email? } — same shape as member submit.
  if ("linkedin" in b || "github" in b || "email" in b) {
    try {
      const links: { linkedin?: string | null; github?: string | null; email?: string | null } = {};
      if ("linkedin" in b) links.linkedin = typeof b.linkedin === "string" ? b.linkedin : null;
      if ("github" in b) links.github = typeof b.github === "string" ? b.github : null;
      if ("email" in b) links.email = typeof b.email === "string" ? b.email : null;
      const submission = await updateSubmissionLinks(id, links);
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

/** Admin: DELETE { id } → remove a submission entirely (spam, duplicate, ex-member). */
export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const id = String(((body ?? {}) as Record<string, unknown>).id ?? "");
  if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });
  try {
    await deleteSubmission(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "Submission not found.") {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }
    console.error("[admin/team DELETE]", err);
    return NextResponse.json({ error: "Delete failed. Retry." }, { status: 500 });
  }
}

/**
 * Admin direct edit from /team: POST { previousName?, name, role,
 * photoDataUrl?, originalDataUrl?, linkedin?, github?, email? }.
 * Creates or updates the approved record — live on /team instantly.
 */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  if (typeof b.name !== "string" || typeof b.role !== "string") {
    return NextResponse.json({ error: "name and role required." }, { status: 400 });
  }
  try {
    const submission = await adminUpsertMember({
      previousName: str(b.previousName),
      name: b.name,
      role: b.role,
      photoDataUrl: str(b.photoDataUrl),
      ...(typeof b.originalDataUrl === "string" ? { originalDataUrl: b.originalDataUrl } : {}),
      linkedin: str(b.linkedin),
      github: str(b.github),
      email: str(b.email),
    });
    return NextResponse.json({ submission });
  } catch (err) {
    if (err instanceof TeamSubmissionError) {
      const first = Object.values(err.errors)[0];
      return NextResponse.json({ error: first ?? "Invalid details.", errors: err.errors }, { status: 400 });
    }
    console.error("[admin/team POST]", err);
    return NextResponse.json({ error: "Save failed. Retry." }, { status: 500 });
  }
}
