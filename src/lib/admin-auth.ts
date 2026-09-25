import { createHmac } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "aws_admin";
const TTL_MS = 12 * 60 * 60 * 1000; // 12h session

function secret(): string {
  return process.env.PASS_SECRET ?? "dev-only-secret-change-me";
}

export function adminPassword(): string {
  return process.env.ADMIN_PASS ?? "admin123";
}

export function signAdmin(expiry: number): string {
  return createHmac("sha256", secret()).update(`admin.${expiry}`).digest("hex").slice(0, 32);
}

export function makeAdminCookie(): { value: string; expires: Date } {
  const expiry = Date.now() + TTL_MS;
  const sig = signAdmin(expiry);
  return { value: `admin.${expiry}.${sig}`, expires: new Date(expiry) };
}

export async function isAdmin(): Promise<boolean> {
  try {
    const jar = await cookies();
    const v = jar.get(ADMIN_COOKIE)?.value ?? "";
    const parts = v.split(".");
    if (parts.length !== 3 || parts[0] !== "admin") return false;
    const expiry = Number(parts[1]);
    if (!Number.isFinite(expiry) || expiry < Date.now()) return false;
    return signAdmin(expiry) === parts[2];
  } catch {
    return false;
  }
}
