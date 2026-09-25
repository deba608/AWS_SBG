import { promises as fs } from "fs";
import path from "path";
import {
  isExpired,
  newPassId,
  qrContentForToken,
  signPass,
  verifyPassToken,
  type PassType,
} from "./pass-token";
import type { FoodPref, Gender } from "./validate-contact";
import { getRedis, withRedisLock } from "./pass-redis";

export interface StoredUser {
  id: string;
  name: string;
  rollNo: string;
  email: string;
  gender: Gender;
  food: FoodPref;
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
const REDIS_KEY = "sbg:passes:v1";
const REDIS_LOCK = "sbg:passes:lock";

function emptyStore(): StoreShape {
  return { users: [], passes: [] };
}

function parseStore(raw: unknown): StoreShape {
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as StoreShape;
      if (Array.isArray(parsed.users) && Array.isArray(parsed.passes)) return parsed;
    } catch {
      // fall through
    }
    return emptyStore();
  }
  if (
    typeof raw === "object" &&
    raw !== null &&
    Array.isArray((raw as StoreShape).users) &&
    Array.isArray((raw as StoreShape).passes)
  ) {
    return raw as StoreShape;
  }
  return emptyStore();
}

async function readStore(): Promise<StoreShape> {
  const redis = getRedis();
  if (redis) {
    try {
      return parseStore(await redis.get(REDIS_KEY));
    } catch {
      return emptyStore();
    }
  }
  try {
    return parseStore(await fs.readFile(FILE, "utf8"));
  } catch {
    return emptyStore();
  }
}

async function writeStore(store: StoreShape): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.set(REDIS_KEY, JSON.stringify(store));
    return;
  }
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(tmp, FILE);
}

/** Probe: false on read-only hosts (serverless without disk). */
export async function storeWritable(): Promise<boolean> {
  try {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    const probe = path.join(path.dirname(FILE), `.probe-${process.pid}`);
    await fs.writeFile(probe, "ok", "utf8");
    await fs.unlink(probe);
    return true;
  } catch {
    return false;
  }
}

/**
 * Serializes read-modify-write ops. In-process queue covers a single server;
 * the Redis lock (SET NX EX) covers multi-instance serverless (Vercel).
 * Without Redis env configured, file store is local-dev only — Vercel's
 * filesystem is read-only, so passes REQUIRE Upstash in production.
 */
let writeQueue: Promise<unknown> = Promise.resolve();
function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(
    () => withRedisLock(REDIS_LOCK, fn),
    () => withRedisLock(REDIS_LOCK, fn),
  );
  writeQueue = run.catch(() => undefined);
  return run;
}

export function findUser(
  store: StoreShape,
  email: string,
  rollNo: string,
): StoredUser | undefined {
  const e = email.trim().toLowerCase();
  const r = rollNo.trim().toUpperCase();
  return store.users.find((u) => u.email === e || u.rollNo === r);
}

/** Idempotent issue: existing email/roll returns existing ENTRY pass. */
export async function issuePasses(input: {
  name: string;
  rollNo: string;
  email: string;
  gender: Gender;
  food: FoodPref;
}): Promise<{ user: StoredUser; passes: StoredPass[]; duplicate: boolean }> {
  return withWriteLock(async () => {
  const email = input.email.trim().toLowerCase();
  const rollNo = input.rollNo.trim().toUpperCase();
  const store = await readStore();
  const existing = findUser(store, email, rollNo);
  if (existing) {
    const entry = store.passes.find((p) => p.userId === existing.id && p.type === "ENTRY");
    if (entry) return { user: existing, passes: [entry], duplicate: true };
  }

  const now = new Date().toISOString();
  const user: StoredUser =
    existing ??
    ({
      id: `u_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`,
      name: input.name,
      rollNo,
      email,
      gender: input.gender,
      food: input.food,
      createdAt: now,
    } satisfies StoredUser);
  if (!existing) store.users.push(user);

  const pid = newPassId();
  const token = signPass("ENTRY", pid);
  const pass: StoredPass = {
    id: pid,
    userId: user.id,
    type: "ENTRY",
    token,
    qrContent: qrContentForToken(token),
    status: "ACTIVE",
    createdAt: now,
    usedAt: null,
    scannedBy: null,
  };
  store.passes.push(pass);
  await writeStore(store);
  return { user, passes: [pass], duplicate: Boolean(existing) };
  });
}

export async function getPassesByContact(
  email: string,
  rollNo: string,
): Promise<{ user: StoredUser; passes: StoredPass[] } | null> {
  const store = await readStore();
  const user = findUser(store, email, rollNo);
  if (!user) return null;
  return { user, passes: store.passes.filter((p) => p.userId === user.id) };
}

export type VerifyResult =
  | { ok: false; reason: "INVALID" | "EXPIRED" }
  | { ok: true; user: StoredUser; pass: StoredPass; alreadyUsed: boolean };

/** Check signature first, then store lookup, then expiry. */
export async function verifyPass(token: string): Promise<VerifyResult> {
  const parsed = verifyPassToken(token.trim());
  if (!parsed) return { ok: false, reason: "INVALID" };
  const store = await readStore();
  const pass = store.passes.find((p) => p.token === token.trim());
  if (!pass) return { ok: false, reason: "INVALID" };
  const user = store.users.find((u) => u.id === pass.userId);
  if (!user) return { ok: false, reason: "INVALID" };
  if (isExpired()) return { ok: false, reason: "EXPIRED" };
  return { ok: true, user, pass, alreadyUsed: pass.status === "USED" };
}

export type BurnResult =
  | { ok: false; reason: "INVALID" | "EXPIRED" | "ALREADY_USED"; user?: StoredUser; pass?: StoredPass }
  | { ok: true; user: StoredUser; pass: StoredPass };

/** Serialized burn: concurrent admins can't double-burn or lose updates. */
export async function burnPass(token: string, scannedBy: string): Promise<BurnResult> {
  return withWriteLock(async () => {
  const t = token.trim();
  if (!verifyPassToken(t)) return { ok: false, reason: "INVALID" };
  if (isExpired()) return { ok: false, reason: "EXPIRED" };
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
  });
}

export async function passStats(): Promise<{
  issued: number;
  users: number;
  entryActive: number;
  entryUsed: number;
  veg: number;
  nonveg: number;
}> {
  const store = await readStore();
  return {
    issued: store.passes.length,
    users: store.users.length,
    entryActive: store.passes.filter((p) => p.type === "ENTRY" && p.status === "ACTIVE").length,
    entryUsed: store.passes.filter((p) => p.type === "ENTRY" && p.status === "USED").length,
    veg: store.users.filter((u) => u.food === "Veg").length,
    nonveg: store.users.filter((u) => u.food === "Non-veg").length,
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
      const hay = `${user?.name ?? ""} ${user?.rollNo ?? ""} ${user?.email ?? ""} ${user?.food ?? ""}`.toLowerCase();
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
