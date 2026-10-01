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
import type { FoodPref, Gender, Year } from "./validate-contact";
import { YEARS, deriveYearFromRollNo } from "./validate-contact";
import { getRedis, withRedisLock } from "./pass-redis";

export const DEFAULT_YEAR_LIMIT = 60;
export type YearLimits = Partial<Record<Year, number | null>>;

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
  /** Study year. Missing on pre-year registrations (legacy). */
  year?: Year;
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
  /** Lunch single-use. Missing (old passes) = ACTIVE. */
  food?: "ACTIVE" | "USED";
  foodUsedAt?: string | null;
  foodScannedBy?: string | null;
}

export type BurnKind = "entry" | "food";

export function foodStatusOf(pass: StoredPass): "ACTIVE" | "USED" {
  return pass.food ?? "ACTIVE";
}

export interface PassSettingsState {
  /** Null = follow PASS_MAX env. */
  maxPasses: number | null;
  /** Null = open. False stops registration. */
  registrationsOpen: boolean | null;
  /** Per-year caps. Null/missing entry = DEFAULT_YEAR_LIMIT (60). */
  yearLimits?: YearLimits;
}

interface StoreShape {
  users: StoredUser[];
  passes: StoredPass[];
  /** Last issued serial number. */
  seq: number;
  settings?: PassSettingsState;
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
  constructor(limit: number) {
    super(`Registrations are full — all ${limit} passes claimed.`);
    this.name = "RegistrationsFullError";
  }
}

/** Thrown when a single year's cap is reached. Maps to 403. */
export class YearRegistrationsFullError extends Error {
  year: Year;
  limit: number;
  constructor(year: Year, limit: number) {
    super(`Registrations are full for ${year} year — all ${limit} passes claimed.`);
    this.name = "YearRegistrationsFullError";
    this.year = year;
    this.limit = limit;
  }
}

/** Thrown when organizers stopped registration. Maps to 403. */
export class RegistrationsClosedError extends Error {
  constructor() {
    super("Registrations are closed by organizers.");
    this.name = "RegistrationsClosedError";
  }
}

/** Hard cap (overridable for tests via PASS_MAX). */
export function maxRegistrations(): number {
  const n = Number(process.env.PASS_MAX ?? 200);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 200;
}

export async function getSettings(): Promise<PassSettingsState> {
  const store = await readStore();
  return {
    maxPasses: store.settings?.maxPasses ?? null,
    registrationsOpen: store.settings?.registrationsOpen ?? null,
    yearLimits: store.settings?.yearLimits ?? {},
  };
}

/** Resolved per-year caps (custom or default 60). */
export function resolveYearLimits(settings?: PassSettingsState | null): Record<Year, number> {
  const out = {} as Record<Year, number>;
  for (const y of YEARS) {
    const v = settings?.yearLimits?.[y];
    out[y] = typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.floor(v) : DEFAULT_YEAR_LIMIT;
  }
  return out;
}

export function yearLimitFor(year: Year, settings?: PassSettingsState | null): number {
  const v = settings?.yearLimits?.[year];
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.floor(v) : DEFAULT_YEAR_LIMIT;
}

export function countByYear(users: StoredUser[]): Record<Year, number> {
  const out = { "1st": 0, "2nd": 0, "3rd": 0, "4th": 0 } as Record<Year, number>;
  for (const u of users) {
    const y = effectiveYearOf(u);
    if (y) out[y] += 1;
  }
  return out;
}

/** Stored year wins; legacy rows without year fall back to roll-prefix (24→3rd, 25→2nd…). */
export function effectiveYearOf(user: { year?: Year | null; rollNo: string }): Year | null {
  if (user.year && (YEARS as string[]).includes(user.year)) return user.year;
  return deriveYearFromRollNo(user.rollNo ?? "");
}

/** Persist roll-derived years onto legacy rows missing one. Returns fixed count. */
function backfillYearsInPlace(store: StoreShape): number {
  let fixed = 0;
  for (const u of store.users) {
    if (u.year && (YEARS as string[]).includes(u.year)) continue;
    const derived = deriveYearFromRollNo(u.rollNo ?? "");
    if (derived) {
      u.year = derived;
      fixed += 1;
    }
  }
  return fixed;
}

/**
 * One-shot migration: assigns 24…→3rd, 25…→2nd (etc.) to old
 * registrations saved before the Year field existed. Idempotent.
 */
export async function migrateYears(): Promise<{ fixed: number; total: number; byYear: Record<Year, number> }> {
  return withWriteLock(async () => {
    const store = await readStore();
    const fixed = backfillYearsInPlace(store);
    if (fixed > 0) await writeStore(store);
    return { fixed, total: store.users.length, byYear: countByYear(store.users) };
  });
}

export async function effectiveLimit(): Promise<number> {
  const s = await getSettings();
  return s.maxPasses ?? maxRegistrations();
}

export async function registrationsAccepting(): Promise<boolean> {
  const s = await getSettings();
  if (s.registrationsOpen === false) return false;
  return true;
}

export async function updateSettings(patch: {
  maxPasses?: number | null;
  registrationsOpen?: boolean | null;
  yearLimits?: YearLimits;
}): Promise<PassSettingsState> {
  return withWriteLock(async () => {
    const store = await readStore();
    const cur = store.settings ?? { maxPasses: null, registrationsOpen: null };
    if (patch.maxPasses !== undefined) {
      cur.maxPasses =
        patch.maxPasses === null || patch.maxPasses === undefined
          ? null
          : Math.max(1, Math.floor(patch.maxPasses));
    }
    if (patch.registrationsOpen !== undefined) {
      cur.registrationsOpen = patch.registrationsOpen;
    }
    if (patch.yearLimits !== undefined) {
      cur.yearLimits = { ...(cur.yearLimits ?? {}) };
      for (const y of YEARS) {
        if (patch.yearLimits[y] === undefined) continue;
        const v = patch.yearLimits[y];
        cur.yearLimits[y] =
          v === null || v === undefined
            ? null
            : Math.min(10000, Math.max(1, Math.floor(v)));
      }
    }
    store.settings = cur;
    await writeStore(store);
    return { ...cur };
  });
}

export interface YearSlot {
  registered: number;
  limit: number;
  open: boolean;
}

export async function registrationCount(): Promise<{ registered: number; limit: number; open: boolean; perYear: Record<Year, YearSlot> }> {
  const store = await readStore();
  const s = store.settings;
  const limit = s?.maxPasses ?? maxRegistrations();
  const byYear = countByYear(store.users);
  const limits = resolveYearLimits(s ?? null);
  const globallyOpen = s?.registrationsOpen !== false;
  const perYear = {} as Record<Year, YearSlot>;
  for (const y of YEARS) {
    perYear[y] = {
      registered: byYear[y],
      limit: limits[y],
      open: globallyOpen && byYear[y] < limits[y],
    };
  }
  const open = globallyOpen && store.users.length < limit;
  return { registered: store.users.length, limit, open, perYear };
}

export async function getUserById(userId: string): Promise<StoredUser | null> {
  const store = await readStore();
  const user = store.users.find((u) => u.id === userId);
  return user ? { ...user } : null;
}

/**
 * Deletes one registration: user + all their passes.
 * Freed serial gets reused by the next registration (lowest-gap fill).
 */
export async function deleteUser(userId: string): Promise<{ removedPasses: number }> {
  return withWriteLock(async () => {
    const store = await readStore();
    const user = store.users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found.");
    const removedPasses = store.passes.filter((p) => p.userId === userId).length;
    store.users = store.users.filter((u) => u.id !== userId);
    store.passes = store.passes.filter((p) => p.userId !== userId);
    await writeStore(store);
    return { removedPasses };
  });
}

/** Patch editable user fields. Uniqueness re-checked. Returns updated user. */export async function updateUser(
  userId: string,
  patch: { name?: string; rollNo?: string; email?: string; mobile?: string; gender?: Gender; food?: FoodPref; year?: Year },
): Promise<StoredUser> {
  return withWriteLock(async () => {
    const store = await readStore();
    const user = store.users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found.");
    const email = patch.email !== undefined ? patch.email.trim().toLowerCase() : user.email;
    const rollNo = patch.rollNo !== undefined ? patch.rollNo.trim().toUpperCase() : user.rollNo;
    const mobile = patch.mobile !== undefined ? patch.mobile.replace(/\D/g, "").slice(-10) : user.mobile;
    const clash = store.users.find(
      (u) =>
        u.id !== userId &&
        (u.email === email || u.rollNo === rollNo || (mobile !== "" && u.mobile === mobile)),
    );
    if (clash) {
      throw new ConflictError("Another registration already uses that email, roll or mobile.");
    }
    if (patch.name !== undefined) user.name = patch.name;
    user.rollNo = rollNo;
    user.email = email;
    user.mobile = mobile;
    if (patch.gender !== undefined) user.gender = patch.gender;
    if (patch.food !== undefined) user.food = patch.food;
    if (patch.year !== undefined) {
      const target = patch.year;
      if (!YEARS.includes(target)) throw new Error("Invalid year.");
      if (target !== effectiveYearOf(user)) {
        const byYear = countByYear(store.users);
        const limit = yearLimitFor(target, store.settings ?? null);
        if (byYear[target] >= limit) throw new YearRegistrationsFullError(target, limit);
      }
      user.year = target;
    }
    await writeStore(store);
    return { ...user };
  });
}

/** One email / roll / mobile = one pass. Re-registration is rejected (409). */
export async function issuePasses(input: {
  name: string;
  rollNo: string;
  email: string;
  mobile: string;
  gender: Gender;
  food: FoodPref;
  year: Year;
}): Promise<{ user: StoredUser; passes: StoredPass[]; duplicate: boolean }> {
  return withWriteLock(async () => {
  const email = input.email.trim().toLowerCase();
  const rollNo = input.rollNo.trim().toUpperCase();
  const mobile = input.mobile.replace(/\D/g, "").slice(-10);
  const year = input.year;
  if (!YEARS.includes(year)) throw new Error("Invalid year.");
  const store = await readStore();
  const existing = findUser(store, email, rollNo, mobile);
  if (existing) {
    throw new ConflictError(
      "This email, roll number or mobile is already registered. Each student gets one pass — use Retrieve below if you lost your QR.",
    );
  }
  if (store.settings?.registrationsOpen === false) {
    throw new RegistrationsClosedError();
  }
  const yearLimit = yearLimitFor(year, store.settings ?? null);
  const yearCount = store.users.filter((u) => effectiveYearOf(u) === year).length;
  if (yearCount >= yearLimit) {
    throw new YearRegistrationsFullError(year, yearLimit);
  }
  const limit = store.settings?.maxPasses ?? maxRegistrations();
  if (store.users.length >= limit) {
    throw new RegistrationsFullError(limit);
  }

  const now = new Date().toISOString();
  ensureSerials(store);
  // Fill lowest free serial first (deleted trial entries get reused),
  // else append after the max. Keeps serials gap-free.
  const taken = new Set(store.users.map((u) => u.serial));
  let n = 1;
  while (taken.has(formatSerial(n))) n += 1;
  store.seq = Math.max(store.seq, n);
  const user: StoredUser = {
    id: `u_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`,
    serial: formatSerial(n),
    name: input.name,
    rollNo,
    email,
    mobile,
    gender: input.gender,
    food: input.food,
    year: input.year,
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
  | { ok: true; user: StoredUser; pass: StoredPass; alreadyUsed: boolean; foodUsed: boolean };

/**
 * Serial No. (A01…) → live pass token. Lets gate verify/burn by serial
 * when QR won't scan. Returns input unchanged when not a serial.
 */
export async function expandSerialToToken(input: string): Promise<string> {
  const t = input.trim();
  if (!/^A\d+$/i.test(t)) return t;
  const serial = t.toUpperCase();
  const store = await readStore();
  const user = store.users.find((u) => (u.serial ?? "").toUpperCase() === serial);
  if (!user) return t;
  const pass =
    store.passes.find((p) => p.userId === user.id && p.type === "ENTRY") ??
    store.passes.find((p) => p.userId === user.id);
  return pass?.token ?? t;
}

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
  return { ok: true, user, pass, alreadyUsed: pass.status === "USED", foodUsed: foodStatusOf(pass) === "USED" };
}

export type BurnResult =
  | { ok: false; reason: "INVALID" | "EXPIRED" | "ALREADY_USED"; kind: BurnKind; user?: StoredUser; pass?: StoredPass }
  | { ok: true; kind: BurnKind; user: StoredUser; pass: StoredPass };

/** Serialized burn: concurrent admins can't double-burn or lose updates. */
export async function burnPass(token: string, scannedBy: string, kind: BurnKind = "entry"): Promise<BurnResult> {
  return withWriteLock(async () => {
  const t = token.trim();
  if (!verifyPassToken(t)) return { ok: false, reason: "INVALID", kind };
  if (isExpired()) return { ok: false, reason: "EXPIRED", kind };
  const store = await readStore();
  const pass = store.passes.find((p) => p.token === t);
  if (!pass) return { ok: false, reason: "INVALID", kind };
  const user = store.users.find((u) => u.id === pass.userId);
  if (!user) return { ok: false, reason: "INVALID", kind };
  if (kind === "food") {
    if (foodStatusOf(pass) === "USED") return { ok: false, reason: "ALREADY_USED", kind, user, pass };
    pass.food = "USED";
    pass.foodUsedAt = new Date().toISOString();
    pass.foodScannedBy = scannedBy || "admin";
    await writeStore(store);
    return { ok: true, kind, user, pass };
  }
  if (pass.status === "USED") return { ok: false, reason: "ALREADY_USED", kind, user, pass };
  pass.status = "USED";
  pass.usedAt = new Date().toISOString();
  pass.scannedBy = scannedBy || "admin";
  await writeStore(store);
  return { ok: true, kind, user, pass };
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
  foodUsed: number;
  foodActive: number;
  years: Record<Year, number>;
}> {
  const store = await readStore();
  const years = countByYear(store.users);
  return {
    issued: store.passes.length,
    users: store.users.length,
    entryActive: store.passes.filter((p) => p.type === "ENTRY" && p.status === "ACTIVE").length,
    entryUsed: store.passes.filter((p) => p.type === "ENTRY" && p.status === "USED").length,
    veg: store.users.filter((u) => u.food === "Veg").length,
    nonveg: store.users.filter((u) => u.food === "Non-veg").length,
    male: store.users.filter((u) => u.gender === "Male").length,
    female: store.users.filter((u) => u.gender === "Female").length,
    foodUsed: store.passes.filter((p) => foodStatusOf(p) === "USED").length,
    foodActive: store.passes.filter((p) => foodStatusOf(p) === "ACTIVE").length,
    years,
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
  year?: string;
}): Promise<{ rows: PassRow[]; total: number }> {
  const store = await readStore();
  const q = (filter.query ?? "").trim().toLowerCase();
  const limit = Math.min(Math.max(filter.limit ?? 200, 1), 1000);
  const rows: PassRow[] = [];
  for (const pass of store.passes) {
    if (filter.type && filter.type !== "ALL" && pass.type !== filter.type) continue;
    if (filter.status && filter.status !== "ALL" && pass.status !== filter.status) continue;
    const user = store.users.find((u) => u.id === pass.userId) ?? null;
    if (filter.year && filter.year !== "ALL" && effectiveYearOf({ year: user?.year, rollNo: user?.rollNo ?? "" }) !== filter.year) continue;
    if (q) {
      const hay = `${user?.name ?? ""} ${user?.serial ?? ""} ${user?.rollNo ?? ""} ${user?.email ?? ""} ${user?.mobile ?? ""} ${user?.food ?? ""} ${user?.year ?? ""} ${user?.gender ?? ""}`.toLowerCase();
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

/**
 * Deletes every user + pass, resets serial counter.
 * Settings (limit / open-closed) preserved.
 * Irreversible — caller must enforce admin auth + explicit confirm.
 */
export async function clearAllRegistrations(): Promise<{
  removedUsers: number;
  removedPasses: number;
}> {
  return withWriteLock(async () => {
    const store = await readStore();
    const removedUsers = store.users.length;
    const removedPasses = store.passes.length;
    await writeStore({ users: [], passes: [], seq: 0, settings: store.settings });
    return { removedUsers, removedPasses };
  });
}
