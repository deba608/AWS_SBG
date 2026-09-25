import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminPassword, makeAdminCookie } from "@/lib/admin-auth";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const password = String((body as Record<string, unknown>).password ?? "");
  if (!password || password !== adminPassword()) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  const { value, expires } = makeAdminCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
  return res;
}
