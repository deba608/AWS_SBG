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
  /** Public serial: A01, A02, … assigned in registration order. */
  serial: string;
  name: string;
  rollNo: string;
  email: string;
  mobile: string;
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
  /** Last issued serial number. */
  seq: number;
}

const FILE = path.join(process.cwd(), ".data-passes", "passes.json");
const REDIS_KEY = "sbg:passes:v1";
const REDIS_LOCK = "sbg:passes:lock";

function emptyStore(): StoreShape {
  return { users: [], passes: [], seq: 0 };
}

export function formatSerial(n: number): string {
  return `A${String(n).padStart(2, "0")}`;
}

/** Backfill serials for pre-serial users, oldest first. Returns next seq. */
function ensureSerials(store: StoreShape): void {
  if (typeof store.seq !== "number") store.seq = 0;
  const missing = store.users
    .filter((u) => !u.serial)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const u of missing) {
    store.seq += 1;
    u.serial = formatSerial(store.seq);
  }
  // keep seq ahead of any hand-set serials
  for (const u of store.users) {
    const m = /^A(\d+)$/.exec(u.serial ?? "");
    if (m) store.seq = Math.max(store.seq, Number(m[1]));
  }
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
  mobile?: string,
): StoredUser | undefined {
  const e = email.trim().toLowerCase();
  const r = rollNo.trim().toUpperCase();
  const m = (mobile ?? "").replace(/\D/g, "").slice(-10);
  return store.users.find(
    (u) => u.email === e || u.rollNo === r || (m !== "" && (u.mobile ?? "").replace(/\D/g, "").slice(-10) === m),
  );
}

/** Thrown when email or roll number is already registered. Maps to 409. */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

/** Thrown when registration cap reached. Maps to 403. */
export class RegistrationsFullError extends Error {
  constructor() {
    super("Registrations are full — all 200 passes claimed.");
    this.name = "RegistrationsFullError";
  }
}

/** Hard cap (overridable for tests via PASS_MAX). */
export function maxRegistrations(): number {
  const n = Number(process.env.PASS_MAX ?? 200);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 200;
}

export async function registrationCount(): Promise<{ registered: number; limit: number; open: boolean }> {
  const store = await readStore();
  const limit = maxRegistrations();
  return { registered: store.users.length, limit, open: store.users.length < limit };
}

/** One email / roll / mobile = one pass. Re-registration is rejected (409). */
export async function issuePasses(input: {
  name: string;
  rollNo: string;
  email: string;
  mobile: string;
  gender: Gender;
  food: FoodPref;
}): Promise<{ user: StoredUser; passes: StoredPass[]; duplicate: boolean }> {
  return withWriteLock(async () => {
  const email = input.email.trim().toLowerCase();
  const rollNo = input.rollNo.trim().toUpperCase();
  const mobile = input.mobile.replace(/\D/g, "").slice(-10);
  const store = await readStore();
  const existing = findUser(store, email, rollNo, mobile);
  if (existing) {
    throw new ConflictError(
      "This email, roll number or mobile is already registered. Each student gets one pass — use Retrieve below if you lost your QR.",
    );
  }
  if (store.users.length >= maxRegistrations()) {
    throw new RegistrationsFullError();
  }

  const now = new Date().toISOString();
  ensureSerials(store);
  store.seq += 1;
  const user: StoredUser = {
    id: `u_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`,
    serial: formatSerial(store.seq),
    name: input.name,
    rollNo,
    email,
    mobile,
    gender: input.gender,
    food: input.food,
    createdAt: now,
  };
  store.users.push(user);

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
  return { user, passes: [pass], duplicate: false };
  });
}

export async function getPassesByContact(
  email: string,
  rollNo: string,
  mobile?: string,
): Promise<{ user: StoredUser; passes: StoredPass[] } | null> {
  const store = await readStore();
  const user = findUser(store, email, rollNo, mobile);
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
  male: number;
  female: number;
}> {
  const store = await readStore();
  return {
    issued: store.passes.length,
    users: store.users.length,
    entryActive: store.passes.filter((p) => p.type === "ENTRY" && p.status === "ACTIVE").length,
    entryUsed: store.passes.filter((p) => p.type === "ENTRY" && p.status === "USED").length,
    veg: store.users.filter((u) => u.food === "Veg").length,
    nonveg: store.users.filter((u) => u.food === "Non-veg").length,
    male: store.users.filter((u) => u.gender === "Male").length,
    female: store.users.filter((u) => u.gender === "Female").length,
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
      const hay = `${user?.name ?? ""} ${user?.serial ?? ""} ${user?.rollNo ?? ""} ${user?.email ?? ""} ${user?.mobile ?? ""} ${user?.food ?? ""}`.toLowerCase();
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
