import { createHmac } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "aws_admin";
const TTL_MS = 12 * 60 * 60 * 1000; // 12h session

function secret(): string {
  return process.env.PASS_SECRET ?? "dev-only-secret-change-me";
}

export type AdminRole = "admin" | "subadmin";

export function adminPassword(): string {
  return process.env.ADMIN_PASS ?? "admin123";
}

/** Entry-gate only password. Set SUB_ADMIN_PASS (alias GATE_PASS) in env. */
export function subAdminPassword(): string | null {
  const v = process.env.SUB_ADMIN_PASS ?? process.env.GATE_PASS ?? "gate123";
  if (!v) return null;
  return v;
}

export function signAdmin(expiry: number, role: AdminRole = "admin"): string {
  return createHmac("sha256", secret()).update(`${role}.${expiry}`).digest("hex").slice(0, 32);
}

export function makeAdminCookie(role: AdminRole = "admin"): { value: string; expires: Date } {
  const expiry = Date.now() + TTL_MS;
  const sig = signAdmin(expiry, role);
  return { value: `${role}.${expiry}.${sig}`, expires: new Date(expiry) };
}

/** Back-compat alias: full-admin cookie. */
export function makeSubAdminCookie(): { value: string; expires: Date } {
  return makeAdminCookie("subadmin");
}

export async function getAdminRole(): Promise<AdminRole | null> {
  try {
    const jar = await cookies();
    const v = jar.get(ADMIN_COOKIE)?.value ?? "";
    const parts = v.split(".");
    if (parts.length !== 3) return null;
    const expiry = Number(parts[1]);
    if (!Number.isFinite(expiry) || expiry < Date.now()) return null;
    // Current format: <role>.<expiry>.<sig>
    if (parts[0] === "admin" || parts[0] === "subadmin") {
      const role = parts[0] as AdminRole;
      return signAdmin(expiry, role) === parts[2] ? role : null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function isAdmin(): Promise<boolean> {
  return (await getAdminRole()) === "admin";
}

/** Sub-admin (entry-gate) session. No dashboard / export / settings access. */
export async function isSubAdmin(): Promise<boolean> {
  return (await getAdminRole()) === "subadmin";
}

/** Entry scanning allowed for full admin + sub-admin. */
export async function hasScanAccess(): Promise<boolean> {
  return (await getAdminRole()) !== null;
}
