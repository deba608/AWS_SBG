import { promises as fs } from "fs";
import path from "path";
import {
  newPassId,
  qrContentForToken,
  signPass,
  verifyPassToken,
  type PassType,
} from "./pass-token";

export interface StoredUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  createdAt: string;
}

export interface StoredPass {
  id: string;
  userId: string;
  type: PassType;
  token: string;
  qrContent: string;
  status: "ACTIVE" | "USED";
  createdAt: string;
  usedAt: string | null;
  scannedBy: string | null;
}

interface StoreShape {
  users: StoredUser[];
  passes: StoredPass[];
}

const FILE = path.join(process.cwd(), ".data-passes", "passes.json");

async function readStore(): Promise<StoreShape> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as StoreShape;
    if (!Array.isArray(parsed.users) || !Array.isArray(parsed.passes)) {
      return { users: [], passes: [] };
    }
    return parsed;
  } catch {
    return { users: [], passes: [] };
  }
}

async function writeStore(store: StoreShape): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(tmp, FILE);
}

export function findUser(
  store: StoreShape,
  email: string,
  mobile: string,
): StoredUser | undefined {
  const e = email.trim().toLowerCase();
  return store.users.find((u) => u.email === e || u.mobile === mobile);
}

/** Idempotent issue: existing email/mobile returns existing passes. */
export async function issuePasses(input: {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
}): Promise<{ user: StoredUser; passes: StoredPass[]; duplicate: boolean }> {
  const email = input.email.trim().toLowerCase();
  const store = await readStore();
  const existing = findUser(store, email, input.mobile);
  if (existing) {
    const passes = store.passes.filter((p) => p.userId === existing.id);
    if (passes.length === 2) return { user: existing, passes, duplicate: true };
  }

  const now = new Date().toISOString();
  const user: StoredUser =
    existing ??
    ({
      id: `u_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`,
      firstName: input.firstName,
      lastName: input.lastName,
      email,
      mobile: input.mobile,
      createdAt: now,
    } satisfies StoredUser);
  if (!existing) store.users.push(user);

  const passes: StoredPass[] = (["ENTRY", "FOOD"] as PassType[]).map((type) => {
    const pid = newPassId();
    const token = signPass(type, pid);
    return {
      id: pid,
      userId: user.id,
      type,
      token,
      qrContent: qrContentForToken(token),
      status: "ACTIVE",
      createdAt: now,
      usedAt: null,
      scannedBy: null,
    } satisfies StoredPass;
  });
  store.passes.push(...passes);
  await writeStore(store);
  return { user, passes, duplicate: Boolean(existing) };
}

export async function getPassesByContact(
  email: string,
  mobile: string,
): Promise<{ user: StoredUser; passes: StoredPass[] } | null> {
  const store = await readStore();
  const user = findUser(store, email, mobile);
  if (!user) return null;
  return { user, passes: store.passes.filter((p) => p.userId === user.id) };
}

export type VerifyResult =
  | { ok: false; reason: "INVALID" }
  | { ok: true; user: StoredUser; pass: StoredPass; alreadyUsed: boolean };

/** Check signature first, then store lookup. */
export async function verifyPass(token: string): Promise<VerifyResult> {
  const parsed = verifyPassToken(token.trim());
  if (!parsed) return { ok: false, reason: "INVALID" };
  const store = await readStore();
  const pass = store.passes.find((p) => p.token === token.trim());
  if (!pass) return { ok: false, reason: "INVALID" };
  const user = store.users.find((u) => u.id === pass.userId);
  if (!user) return { ok: false, reason: "INVALID" };
  return { ok: true, user, pass, alreadyUsed: pass.status === "USED" };
}

export type BurnResult =
  | { ok: false; reason: "INVALID" | "ALREADY_USED"; user?: StoredUser; pass?: StoredPass }
  | { ok: true; user: StoredUser; pass: StoredPass };

/** Atomic-ish burn: re-read, check ACTIVE, write USED. */
export async function burnPass(token: string, scannedBy: string): Promise<BurnResult> {
  const t = token.trim();
  if (!verifyPassToken(t)) return { ok: false, reason: "INVALID" };
  const store = await readStore();
  const pass = store.passes.find((p) => p.token === t);
  if (!pass) return { ok: false, reason: "INVALID" };
  const user = store.users.find((u) => u.id === pass.userId);
  if (!user) return { ok: false, reason: "INVALID" };
  if (pass.status === "USED") return { ok: false, reason: "ALREADY_USED", user, pass };
  pass.status = "USED";
  pass.usedAt = new Date().toISOString();
  pass.scannedBy = scannedBy || "admin";
  await writeStore(store);
  return { ok: true, user, pass };
}

export async function passStats(): Promise<{
  issued: number;
  users: number;
  entryActive: number;
  entryUsed: number;
  foodActive: number;
  foodUsed: number;
}> {
  const store = await readStore();
  return {
    issued: store.passes.length,
    users: store.users.length,
    entryActive: store.passes.filter((p) => p.type === "ENTRY" && p.status === "ACTIVE").length,
    entryUsed: store.passes.filter((p) => p.type === "ENTRY" && p.status === "USED").length,
    foodActive: store.passes.filter((p) => p.type === "FOOD" && p.status === "ACTIVE").length,
    foodUsed: store.passes.filter((p) => p.type === "FOOD" && p.status === "USED").length,
  };
}

export interface PassRow {
  pass: StoredPass;
  user: StoredUser | null;
}

/** Filtered list, newest first. Cap limit to protect <500 scale. */
export async function listPasses(filter: {
  query?: string;
  type?: string;
  status?: string;
  limit?: number;
}): Promise<{ rows: PassRow[]; total: number }> {
  const store = await readStore();
  const q = (filter.query ?? "").trim().toLowerCase();
  const limit = Math.min(Math.max(filter.limit ?? 200, 1), 1000);
  const rows: PassRow[] = [];
  for (const pass of store.passes) {
    if (filter.type && filter.type !== "ALL" && pass.type !== filter.type) continue;
    if (filter.status && filter.status !== "ALL" && pass.status !== filter.status) continue;
    const user = store.users.find((u) => u.id === pass.userId) ?? null;
    if (q) {
      const hay = `${user?.firstName ?? ""} ${user?.lastName ?? ""} ${user?.email ?? ""} ${user?.mobile ?? ""}`.toLowerCase();
      if (!hay.includes(q)) continue;
    }
    rows.push({ pass, user });
  }
  rows.sort((a, b) => b.pass.createdAt.localeCompare(a.pass.createdAt));
  return { rows: rows.slice(0, limit), total: rows.length };
}

/** Recently burned, newest burn first. */
export async function recentScans(limit = 20): Promise<PassRow[]> {
  const store = await readStore();
  return store.passes
    .filter((p) => p.status === "USED")
    .sort((a, b) => (b.usedAt ?? "").localeCompare(a.usedAt ?? ""))
    .slice(0, Math.min(Math.max(limit, 1), 100))
    .map((pass) => ({
      pass,
      user: store.users.find((u) => u.id === pass.userId) ?? null,
    }));
}
