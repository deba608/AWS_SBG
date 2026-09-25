import { createHmac, randomBytes } from "crypto";

export type PassType = "ENTRY" | "FOOD";

const SECRET = process.env.PASS_SECRET ?? "dev-only-secret-change-me";

export function newPassId(): string {
  return `p_${randomBytes(8).toString("hex")}`;
}

/** token = TYPE.pid.sig — sig binds type+pid, not guessable */
export function signPass(type: PassType, pid: string): string {
  const sig = createHmac("sha256", SECRET)
    .update(`${type}.${pid}`)
    .digest("hex")
    .slice(0, 32);
  return `${type}.${pid}.${sig}`;
}

export function verifyPassToken(token: string): { type: PassType; pid: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [type, pid, sig] = parts;
  if (type !== "ENTRY" && type !== "FOOD") return null;
  const expected = signPass(type as PassType, pid).split(".")[2];
  if (sig.length !== expected.length) return null;
  // constant-time-ish compare
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return null;
  return { type: type as PassType, pid };
}

export function qrContentForToken(token: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://awssbgsuiit.vercel.app";
  return `${base.replace(/\/$/, "")}/admin/scan?t=${encodeURIComponent(token)}`;
}
