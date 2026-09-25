import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { ConflictError, getUserById, updateUser } from "@/lib/pass-store";
import {
  collapseSpaces,
  validateRegistration,
} from "@/lib/validate-contact";

/** Admin edit of a registration: PATCH { userId, patch: { name?, rollNo?, email?, mobile?, gender?, food? } } */
export async function PATCH(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const userId = String(b.userId ?? "");
  const p = (b.patch ?? {}) as Record<string, unknown>;
  if (!userId || typeof p !== "object") {
    return NextResponse.json({ error: "userId and patch required." }, { status: 400 });
  }
  const current = await getUserById(userId);
  if (!current) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const merged = {
    fullName: p.name !== undefined ? String(p.name) : current.name,
    rollNo: p.rollNo !== undefined ? String(p.rollNo) : current.rollNo,
    email: p.email !== undefined ? String(p.email) : current.email,
    mobile: p.mobile !== undefined ? String(p.mobile) : current.mobile,
    gender: p.gender !== undefined ? String(p.gender) : current.gender,
    food: p.food !== undefined ? String(p.food) : current.food,
  };
  const errors = validateRegistration(merged);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Validation failed.", errors }, { status: 400 });
  }
  try {
    const user = await updateUser(userId, {
      ...(p.name !== undefined ? { name: collapseSpaces(String(p.name)) } : {}),
      ...(p.rollNo !== undefined ? { rollNo: String(p.rollNo) } : {}),
      ...(p.email !== undefined ? { email: String(p.email) } : {}),
      ...(p.mobile !== undefined ? { mobile: String(p.mobile) } : {}),
      ...(p.gender !== undefined ? { gender: String(p.gender) as "Male" | "Female" } : {}),
      ...(p.food !== undefined ? { food: String(p.food) as "Veg" | "Non-veg" } : {}),
    });
    return NextResponse.json({ user });
  } catch (err) {
    if (err instanceof ConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof Error && err.message === "User not found.") {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    console.error("[admin/users]", err);
    return NextResponse.json({ error: "Update failed. Retry." }, { status: 500 });
  }
}
