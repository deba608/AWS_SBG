import { NextResponse } from "next/server";
import { getAdminRole } from "@/lib/admin-auth";

export async function GET() {
  const role = await getAdminRole();
  return NextResponse.json({ admin: role !== null, role, subadmin: role === "subadmin" });
}
