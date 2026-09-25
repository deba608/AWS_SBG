import { promises as fs } from "fs";
import path from "path";
import { newPassId, qrContentForToken, signPass, type PassType } from "./pass-token";

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
