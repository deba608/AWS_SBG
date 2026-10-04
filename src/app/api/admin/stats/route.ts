import { NextResponse } from "next/server";
import { hasScanAccess } from "@/lib/admin-auth";
import { passStats } from "@/lib/pass-store";

export async function GET() {
  if (!(await hasScanAccess())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json(await passStats());
}
