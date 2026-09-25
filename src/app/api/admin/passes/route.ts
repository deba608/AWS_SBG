import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listPasses } from "@/lib/pass-store";

export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const { rows, total } = await listPasses({
    query: searchParams.get("q") ?? "",
    type: searchParams.get("type") ?? "ALL",
    status: searchParams.get("status") ?? "ALL",
    limit: Number(searchParams.get("limit") ?? 200),
  });
  return NextResponse.json({
    total,
    rows: rows.map(({ pass, user }) => ({
      type: pass.type,
      status: pass.status,
      token: pass.token,
      createdAt: pass.createdAt,
      usedAt: pass.usedAt,
      scannedBy: pass.scannedBy,
      name: user?.name ?? "—",
      serial: user?.serial ?? "—",
      email: user?.email ?? "—",
      mobile: user?.mobile ?? "—",
      rollNo: user?.rollNo ?? "—",
      gender: user?.gender ?? "—",
      food: user?.food ?? "—",
    })),
  });
}
