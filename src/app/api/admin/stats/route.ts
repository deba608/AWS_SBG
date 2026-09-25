import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { passStats } from "@/lib/pass-store";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json(await passStats());
}
