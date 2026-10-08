// Demo QR generator: appends 3 TEST passes to the real store (Redis) + writes PNGs.
// Run: node scripts/make-demo-qrs.mjs
// Idempotent: reuses existing demo emails, never wipes real registrations.
import { createHmac, randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import QRCode from "qrcode";
import { Redis } from "@upstash/redis";

const ROOT = process.cwd();
const REDIS_KEY = "sbg:passes:v1";
const SECRET = process.env.PASS_SECRET ?? "dev-only-secret-change-me";
const BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://awssbgsuiit.vercel.app").replace(/\/$/, "");

// --- load .env.local (no deps) so UPSTASH vars exist when run via plain node ---
try {
  const raw = await fs.readFile(path.join(ROOT, ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    const k = t.slice(0, i).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
} catch { /* .env.local optional */ }

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
if (!url || !token) {
  console.error("MISS_UPSTASH: set UPSTASH_REDIS_REST_URL/_TOKEN in .env.local");
  process.exit(1);
}
const redis = new Redis({ url, token });

function signPass(type, pid) {
  const sig = createHmac("sha256", SECRET).update(`${type}.${pid}`).digest("hex").slice(0, 32);
  return `${type}.${pid}.${sig}`;
}
const fmtSerial = (n) => `A${String(n).padStart(2, "0")}`;

function parseStore(raw) {
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p.users) && Array.isArray(p.passes)) return p;
    } catch { /* fall */ }
    return { users: [], passes: [], seq: 0 };
  }
  if (raw && Array.isArray(raw.users) && Array.isArray(raw.passes)) return raw;
  return { users: [], passes: [], seq: 0 };
}

// 3 demos cover full gate matrix: fresh GREEN, entry-USED RED, food-USED (entry still GREEN)
const DEMOS = [
  { name: "Demo Active One", rollNo: "25DEMO01", email: "demo-scan-01@suiit.ac.in", mobile: "9876543201", gender: "Male", food: "Veg", year: "2nd", want: "ACTIVE_ENTRY" },
  { name: "Demo Used Two", rollNo: "25DEMO02", email: "demo-scan-02@suiit.ac.in", mobile: "9876543202", gender: "Female", food: "Veg", year: "2nd", want: "ENTRY_USED" },
  { name: "Demo Food Three", rollNo: "25DEMO03", email: "demo-scan-03@suiit.ac.in", mobile: "9876543203", gender: "Male", food: "Non-veg", year: "1st", want: "FOOD_USED" },
];

const store = parseStore(await redis.get(REDIS_KEY));
store.users ??= [];
store.passes ??= [];
if (typeof store.seq !== "number") store.seq = 0;
for (const u of store.users) {
  const m = /^A(\d+)$/.exec(u.serial ?? "");
  if (m) store.seq = Math.max(store.seq, Number(m[1]));
}

const now = new Date().toISOString();
const results = [];

for (const d of DEMOS) {
  let user = store.users.find((u) => u.email === d.email || u.rollNo === d.rollNo);
  let pass;
  if (user) {
    pass = store.passes.find((p) => p.userId === user.id && p.type === "ENTRY") ?? store.passes.find((p) => p.userId === user.id);
  } else {
    const taken = new Set(store.users.map((u) => u.serial));
    let n = 1;
    while (taken.has(fmtSerial(n))) n += 1;
    store.seq = Math.max(store.seq, n);
    user = {
      id: `u_demo${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}${n}`,
      serial: fmtSerial(n),
      name: d.name, rollNo: d.rollNo, email: d.email, mobile: d.mobile,
      gender: d.gender, food: d.food, year: d.year, createdAt: now,
    };
    store.users.push(user);
    const pid = `p_${randomBytes(8).toString("hex")}`;
    const tok = signPass("ENTRY", pid);
    pass = {
      id: pid, userId: user.id, type: "ENTRY", token: tok,
      qrContent: `${BASE}/admin/scan?t=${encodeURIComponent(tok)}`,
      status: "ACTIVE", createdAt: now, usedAt: null, scannedBy: null,
    };
    store.passes.push(pass);
  }
  // force wanted state so re-runs stay deterministic
  if (d.want === "ENTRY_USED") {
    pass.status = "USED"; pass.usedAt = pass.usedAt ?? now; pass.scannedBy = pass.scannedBy ?? "demo-setup";
  } else if (d.want === "FOOD_USED") {
    pass.status = "ACTIVE"; pass.usedAt = null; pass.scannedBy = null;
    pass.food = "USED"; pass.foodUsedAt = pass.foodUsedAt ?? now; pass.foodScannedBy = pass.foodScannedBy ?? "demo-setup";
  } else {
    pass.status = "ACTIVE"; pass.usedAt = null; pass.scannedBy = null;
    if (pass.food === "USED" && d.want === "ACTIVE_ENTRY") { pass.food = "ACTIVE"; pass.foodUsedAt = null; pass.foodScannedBy = null; }
  }
  results.push({ user, pass, want: d.want });
}

await redis.set(REDIS_KEY, JSON.stringify(store));

const outDir = path.join(ROOT, "public", "demo-qrs");
await fs.mkdir(outDir, { recursive: true });
const manifest = [];
for (const { user, pass, want } of results) {
  const png = path.join(outDir, `${user.serial}.png`);
  await QRCode.toFile(png, pass.qrContent, { width: 800, margin: 2 });
  manifest.push({
    serial: user.serial, name: user.name, email: user.email, rollNo: user.rollNo,
    want, entryStatus: pass.status, foodStatus: pass.food ?? "ACTIVE",
    token: pass.token, qrContent: pass.qrContent, png: `public/demo-qrs/${user.serial}.png`,
  });
}
await fs.writeFile(path.join(outDir, "demo-qrs.json"), JSON.stringify(manifest, null, 2), "utf8");

console.log("STORE users=" + store.users.length + " passes=" + store.passes.length);
for (const m of manifest) {
  console.log(`--- ${m.serial} ${m.name} want=${m.want} entry=${m.entryStatus} food=${m.foodStatus}`);
  console.log(`PNG: ${m.png}`);
  console.log(`SCAN: ${m.qrContent}`);
  console.log(`TOKEN: ${m.token}`);
}
