import { promises as fs } from "fs";
import path from "path";
import {
  collapseSpaces,
  normalizeEmail,
  normalizeMobile,
} from "./validate-contact";
import { getRedis, withRedisLock } from "./pass-redis";

export const PAYOUT_EVENTS = [
  "DecodeX Hackathon",
  "Tech Parliament",
  "Make-A-Bot",
] as const;
export type PayoutEvent = (typeof PAYOUT_EVENTS)[number];

export const PAYOUT_POSITIONS = ["1st", "2nd", "3rd"] as const;
export type PayoutPosition = (typeof PAYOUT_POSITIONS)[number];

export const PAYOUT_METHODS = ["UPI", "Bank"] as const;
export type PayoutMethod = (typeof PAYOUT_METHODS)[number];

export const PAYOUT_STATUS = ["submitted", "verified", "paid", "rejected"] as const;
export type PayoutStatus = (typeof PAYOUT_STATUS)[number];

export interface PayoutInput {
  name: string;
  rollNo: string;
  email: string;
  mobile: string;
  event: string;
  position: string;
  teamName: string;
  method: string;
  upiId: string;
  upiMobile: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifsc: string;
  consent: boolean;
}

export interface PayoutRecord {
  id: string;
  name: string;
  rollNo: string;
  email: string;
  mobile: string;
  event: string;
  position: string;
  teamName: string;
  method: PayoutMethod;
  upiId: string;
  upiMobile: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  status: PayoutStatus;
  amount: number | null;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export type PayoutErrors = Partial<
  Record<
    | "name"
    | "rollNo"
    | "email"
    | "mobile"
    | "event"
    | "position"
    | "teamName"
    | "method"
    | "upiId"
    | "upiMobile"
    | "bankName"
    | "accountHolder"
    | "accountNumber"
    | "confirmAccountNumber"
    | "ifsc"
    | "consent"
    | "form",
    string
  >
>;

interface PayoutStoreShape {
  payouts: PayoutRecord[];
}

const FILE = path.join(process.cwd(), ".data-payouts", "payouts.json");
const REDIS_KEY = "sbg:payouts:v1";
const REDIS_LOCK = "sbg:payouts:lock";

const NAME_RE = /^[A-Za-z][A-Za-z.'\- ]*$/;
const ROLL_RE = /^[A-Za-z0-9][A-Za-z0-9/.\- ]{2,19}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UPI_RE = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const BANK_NAME_RE = /^[A-Za-z][A-Za-z0-9 .&'/-]*$/;

function emptyStore(): PayoutStoreShape {
  return { payouts: [] };
}

/** Backfill new fields so old records never break the admin table/CSV. */
function backfill(p: PayoutRecord): PayoutRecord {
  return {
    ...p,
    upiMobile: typeof p.upiMobile === "string" ? p.upiMobile : "",
    bankName: typeof p.bankName === "string" ? p.bankName : "",
    upiId: typeof p.upiId === "string" ? p.upiId : "",
    accountHolder: typeof p.accountHolder === "string" ? p.accountHolder : "",
    accountNumber: typeof p.accountNumber === "string" ? p.accountNumber : "",
    ifsc: typeof p.ifsc === "string" ? p.ifsc : "",
    teamName: typeof p.teamName === "string" ? p.teamName : "",
  };
}

function parseStore(raw: unknown): PayoutStoreShape {
  const coerce = (teams: unknown): PayoutStoreShape => {
    if (!Array.isArray(teams)) return emptyStore();
    return { payouts: (teams as PayoutRecord[]).map(backfill) };
  };
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as PayoutStoreShape;
      if (Array.isArray(parsed.payouts)) return coerce(parsed.payouts);
    } catch {
      // fall through
    }
    return emptyStore();
  }
  if (typeof raw === "object" && raw !== null && Array.isArray((raw as PayoutStoreShape).payouts)) {
    return coerce((raw as PayoutStoreShape).payouts);
  }
  return emptyStore();
}

async function readStore(): Promise<PayoutStoreShape> {
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

async function writeStore(store: PayoutStoreShape): Promise<void> {
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

let writeQueue: Promise<unknown> = Promise.resolve();
function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(
    () => withRedisLock(REDIS_LOCK, fn),
    () => withRedisLock(REDIS_LOCK, fn),
  );
  writeQueue = run.catch(() => undefined);
  return run;
}

export class PayoutConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PayoutConflictError";
  }
}

export function validatePayout(input: PayoutInput): PayoutErrors {
  const errors: PayoutErrors = {};
  const name = collapseSpaces(input.name ?? "");
  if (!name) errors.name = "Full name required.";
  else if (name.length < 2) errors.name = "Enter full name.";
  else if (name.length > 60) errors.name = "Name too long (max 60).";
  else if (!NAME_RE.test(name)) errors.name = "Letters, spaces ( . ' - ) only.";

  const roll = String(input.rollNo ?? "").trim().toUpperCase();
  if (!roll) errors.rollNo = "Roll number required.";
  else if (roll.length > 20) errors.rollNo = "Roll number too long.";
  else if (!ROLL_RE.test(roll)) errors.rollNo = "Enter a valid roll number.";

  const email = normalizeEmail(String(input.email ?? ""));
  if (!email) errors.email = "College mail required.";
  else if (email.length > 100) errors.email = "Email too long.";
  else if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email.";
  else if (!email.endsWith("@suiit.ac.in")) errors.email = "Use SUIIT mail (@suiit.ac.in).";

  const mobile = normalizeMobile(String(input.mobile ?? ""));
  if (!mobile) errors.mobile = "Mobile required.";
  else if (!/^[6-9]\d{9}$/.test(mobile)) errors.mobile = "Enter a valid 10-digit Indian mobile.";

  if (!PAYOUT_EVENTS.includes(input.event as PayoutEvent)) errors.event = "Pick an event.";
  if (!PAYOUT_POSITIONS.includes(input.position as PayoutPosition)) errors.position = "Pick a position.";
  if (!PAYOUT_METHODS.includes(input.method as PayoutMethod)) errors.method = "Pick UPI or Bank.";

  const teamName = collapseSpaces(input.teamName ?? "");
  if (teamName.length > 40) errors.teamName = "Team name too long (max 40).";

  if (input.method === "UPI") {
    const upi = String(input.upiId ?? "").trim();
    const upiMobile = normalizeMobile(String(input.upiMobile ?? ""));
    if (!upi && !upiMobile) {
      errors.upiId = "Enter UPI ID or UPI-linked mobile (at least one).";
    } else {
      if (upi) {
        if (upi.length > 100) errors.upiId = "UPI ID too long.";
        else if (!UPI_RE.test(upi)) errors.upiId = "Enter a valid UPI ID (name@bank).";
      }
      if (upiMobile && !/^[6-9]\d{9}$/.test(upiMobile)) {
        errors.upiMobile = "Enter the 10-digit UPI-linked mobile.";
      }
    }
    const bankName = collapseSpaces(input.bankName ?? "");
    if (!bankName) errors.bankName = "Banking name required for verification (e.g. SBI).";
    else if (bankName.length < 2) errors.bankName = "Enter full banking name.";
    else if (bankName.length > 60) errors.bankName = "Banking name too long (max 60).";
    else if (!BANK_NAME_RE.test(bankName)) errors.bankName = "Letters, numbers, spaces ( . & ' / - ) only.";
  } else if (input.method === "Bank") {
    const bankName = collapseSpaces(input.bankName ?? "");
    if (!bankName) errors.bankName = "Bank name required (e.g. SBI).";
    else if (bankName.length < 2) errors.bankName = "Enter full bank name.";
    else if (bankName.length > 60) errors.bankName = "Bank name too long (max 60).";
    else if (!BANK_NAME_RE.test(bankName)) errors.bankName = "Letters, numbers, spaces ( . & ' / - ) only.";
    const holder = collapseSpaces(input.accountHolder ?? "");
    if (!holder) errors.accountHolder = "Account holder name required.";
    else if (holder.length < 2) errors.accountHolder = "Enter full holder name.";
    else if (holder.length > 60) errors.accountHolder = "Holder name too long.";
    else if (!NAME_RE.test(holder)) errors.accountHolder = "Letters, spaces ( . ' - ) only.";
    const acct = String(input.accountNumber ?? "").replace(/\s/g, "");
    if (!acct) errors.accountNumber = "Account number required.";
    else if (!/^\d{9,18}$/.test(acct)) errors.accountNumber = "Account number must be 9–18 digits.";
    const confirm = String(input.confirmAccountNumber ?? "").replace(/\s/g, "");
    if (!confirm) errors.confirmAccountNumber = "Re-enter account number to confirm.";
    else if (confirm !== acct) errors.confirmAccountNumber = "Account numbers do not match.";
    const ifsc = String(input.ifsc ?? "").trim().toUpperCase();
    if (!ifsc) errors.ifsc = "IFSC required.";
    else if (!IFSC_RE.test(ifsc)) errors.ifsc = "Enter a valid IFSC (ABCD0123456).";
  }

  if (input.consent !== true) errors.consent = "Consent required to send prize money.";
  return errors;
}

function normalizeInput(input: PayoutInput): Omit<PayoutRecord, "id" | "status" | "amount" | "note" | "createdAt" | "updatedAt"> {
  const method: PayoutMethod = input.method === "Bank" ? "Bank" : "UPI";
  return {
    name: collapseSpaces(input.name ?? ""),
    rollNo: String(input.rollNo ?? "").trim().toUpperCase(),
    email: normalizeEmail(String(input.email ?? "")),
    mobile: normalizeMobile(String(input.mobile ?? "")),
    event: (PAYOUT_EVENTS.includes(input.event as PayoutEvent) ? input.event : "DecodeX Hackathon") as PayoutRecord["event"],
    position: (PAYOUT_POSITIONS.includes(input.position as PayoutPosition)
      ? input.position
      : "1st") as PayoutRecord["position"],
    teamName: collapseSpaces(input.teamName ?? ""),
    method,
    upiId: method === "UPI" ? String(input.upiId ?? "").trim() : "",
    upiMobile: method === "UPI" ? normalizeMobile(String(input.upiMobile ?? "")) : "",
    bankName: collapseSpaces(input.bankName ?? ""),
    accountHolder: method === "Bank" ? collapseSpaces(input.accountHolder ?? "") : "",
    accountNumber: method === "Bank" ? String(input.accountNumber ?? "").replace(/\s/g, "") : "",
    ifsc: method === "Bank" ? String(input.ifsc ?? "").trim().toUpperCase() : "",
  };
}

/** One payout request per winner per event (same email+event blocked). */
export async function submitPayout(input: PayoutInput): Promise<{ payout: PayoutRecord }> {
  return withWriteLock(async () => {
    const errors = validatePayout(input);
    if (Object.keys(errors).length > 0) {
      throw new Error("Validation failed.");
    }
    const store = await readStore();
    const norm = normalizeInput(input);
    const dup = store.payouts.find(
      (p) => p.email === norm.email && p.event === norm.event,
    );
    if (dup) {
      throw new PayoutConflictError(
        `${norm.email} already submitted payout details for ${norm.event} — contact organizers to edit.`,
      );
    }
    const now = new Date().toISOString();
    const payout: PayoutRecord = {
      ...norm,
      id: `p_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`,
      status: "submitted",
      amount: null,
      note: "",
      createdAt: now,
      updatedAt: now,
    };
    store.payouts.push(payout);
    await writeStore(store);
    return { payout };
  });
}

export async function listPayouts(): Promise<{ payouts: PayoutRecord[]; total: number }> {
  const store = await readStore();
  const payouts = [...store.payouts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { payouts, total: payouts.length };
}

export async function updatePayout(
  id: string,
  patch: { status?: string; amount?: number | null; note?: string },
): Promise<{ payout: PayoutRecord }> {
  return withWriteLock(async () => {
    const store = await readStore();
    const payout = store.payouts.find((p) => p.id === id);
    if (!payout) throw new Error("Payout not found.");
    if (patch.status !== undefined) {
      if (!PAYOUT_STATUS.includes(patch.status as PayoutStatus)) throw new Error("Invalid status.");
      payout.status = patch.status as PayoutStatus;
    }
    if (patch.amount !== undefined) {
      if (patch.amount === null) payout.amount = null;
      else {
        const n = Number(patch.amount);
        if (!Number.isFinite(n) || n < 0 || n > 1000000) throw new Error("Invalid amount.");
        payout.amount = Math.floor(n);
      }
    }
    if (patch.note !== undefined) {
      payout.note = String(patch.note).slice(0, 300);
    }
    payout.updatedAt = new Date().toISOString();
    await writeStore(store);
    return { payout };
  });
}

export async function deletePayout(id: string): Promise<void> {
  return withWriteLock(async () => {
    const store = await readStore();
    if (!store.payouts.some((p) => p.id === id)) throw new Error("Payout not found.");
    store.payouts = store.payouts.filter((p) => p.id !== id);
    await writeStore(store);
  });
}
