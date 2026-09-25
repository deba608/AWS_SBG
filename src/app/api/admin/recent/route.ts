import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { recentScans } from "@/lib/pass-store";

/** Latest gate burns for the dashboard feed. */
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 10), 1), 50);
  const rows = await recentScans(limit);
  return NextResponse.json({
    rows: rows.map(({ pass, user }) => ({
      type: pass.type,
      name: user?.name ?? "—",
      rollNo: user?.rollNo ?? "—",
      food: user?.food ?? "—",
      usedAt: pass.usedAt,
      scannedBy: pass.scannedBy ?? "—",
    })),
  });
}
