import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminPassword, makeAdminCookie, subAdminPassword, type AdminRole } from "@/lib/admin-auth";
import { warnDefaultSecrets } from "@/lib/pass-token";
import { clientIp, rateOk } from "@/lib/rate-limit";

export async function POST(req: Request) {
  warnDefaultSecrets();
  if (!rateOk(`login:${clientIp(req)}`, 8, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Wait a minute." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const password = String((body as Record<string, unknown>).password ?? "");
  let role: AdminRole | null = null;
  if (password && password === adminPassword()) {
    role = "admin";
  } else {
    const gate = subAdminPassword();
    if (gate && password && password === gate && password !== adminPassword()) {
      role = "subadmin";
    }
  }
  if (!role) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  const { value, expires } = makeAdminCookie(role);
  const res = NextResponse.json({ ok: true, role });
  res.cookies.set(ADMIN_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
  return res;
}
