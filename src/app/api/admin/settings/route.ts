import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import {
  effectiveLimit,
  getSettings,
  registrationCount,
  updateSettings,
} from "@/lib/pass-store";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const [settings, count] = await Promise.all([getSettings(), registrationCount()]);
  return NextResponse.json({
    settings,
    registered: count.registered,
    limit: count.limit,
    open: count.open,
    envLimit: await effectiveLimit(),
  });
}

export async function PATCH(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const patch: { maxPasses?: number | null; registrationsOpen?: boolean | null } = {};
  if ("maxPasses" in b) {
    if (b.maxPasses === null) patch.maxPasses = null;
    else {
      const n = Number(b.maxPasses);
      if (!Number.isFinite(n) || n < 1 || n > 10000) {
        return NextResponse.json({ error: "maxPasses must be 1–10000 or null." }, { status: 400 });
      }
      patch.maxPasses = Math.floor(n);
    }
  }
  if ("registrationsOpen" in b) {
    if (b.registrationsOpen === null) patch.registrationsOpen = null;
    else if (typeof b.registrationsOpen !== "boolean") {
      return NextResponse.json({ error: "registrationsOpen must be boolean or null." }, { status: 400 });
    } else patch.registrationsOpen = b.registrationsOpen;
  }
  const settings = await updateSettings(patch);
  const count = await registrationCount();
  return NextResponse.json({
    settings,
    registered: count.registered,
    limit: count.limit,
    open: count.open,
  });
}
