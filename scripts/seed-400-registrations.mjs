/**
 * Merge-seed registrations (NO duplicates, NO overwrite).
 * - Loads live store (Redis, else .data-passes/passes.json).
 * - 224 real rows: only rows whose roll/email/mobile are all unused get added.
 * - Filler (Odia/Indian names) tops total up to --total=425, skipping any
 *   roll/email/mobile/name already in store or in this batch.
 * - Appends with next serials (A..), signed ENTRY passes, staggered createdAt.
 * - Raises caps: maxPasses 1000, each year 300. Existing users/passes untouched.
 *
 * Run: node scripts/seed-400-registrations.mjs [--total=425] [--dry-run]
 */
import { createHmac, randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const FILE = path.join(ROOT, ".data-passes", "passes.json");
const REDIS_KEY = "sbg:passes:v1";
const SECRET = process.env.PASS_SECRET ?? "dev-only-secret-change-me";
const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://awssbgsuiit.vercel.app").replace(/\/$/, "");

// ---------- 224 real rows pasted from user list ----------
const REAL = `
ABHASH DASH|24BTCSE01
ABHIRNA PRADHAN|24BTCSE02
ABHISEKH MISRA|24BTCSE03
ADITYA MISHRA|24BTCSE04
ADITYA PADHIHARI|24BTCSE05
AKSHAYA RAUTA|24BTCSE06
ANKIT BISWAL|24BTCSE07
ANKIT MOHANTY|24BTCSE08
ARNAB PATTNAIK|24BTCSE09
ARYA BARAL|24BTCSE10
ARYAN SHLOK|24BTCSE11
ASHISH PANDA|24BTCSE12
AUROBIND BHUYAN|24BTCSE13
AYANSH MISHRA|24BTCSE14
AYUSH DASH|24BTCSE15
AYUSH PRADHAN|24BTCSE16
BIBHUPRASAD SAMAL|24BTCSE17
BIDISHNA PRIYADARSINI|24BTCSE18
BISHNU SENAPATI|24BTCSE19
BISWAJIT PRADHAN|24BTCSE20
BISWOJIT SAHOO|24BTCSE21
BYAPTI SENAPATI|24BTCSE22
BYOMKESH DUBEY|24BTCSE23
CHINTAMANI MOHANTA|24BTCSE24
CHIRANJEEV MOHAPATRA|24BTCSE25
DEBASHISH PRADHAN|24BTCSE26
DEBASNIGDHA MOHAKUD|24BTCSE27
DEBIPRASAD MOHANTA|24BTCSE28
DHANRUJAY HOTA|24BTCSE29
GADNAYAK RANI|24BTCSE30
JAYA MUDULI|24BTCSE31
KAUSTAV JENA|24BTCSE32
KHIRABDI PATEL|24BTCSE33
MADHUMATI MOHANTY|24BTCSE34
MAITRIMAYEE DAS|24BTCSE35
MAMIDIPALLI TANISHA|24BTCSE36
MANAS DIKSHIT|24BTCSE37
MANYUSH AROSHIS|24BTCSE38
MRUTYUNJAY JENA|24BTCSE39
NIRUPAMA MAHAKUD|24BTCSE40
PRABHUPADA MISHRA|24BTCSE41
PRABHURANJAN SENAPATI|24BTCSE42
PRATIK SAMAL|24BTCSE43
PRATIK SAMANTRAY|24BTCSE44
PRATINGYA SWAIN|24BTCSE45
PREETI PRIYADARSHINI|24BTCSE46
PREETI NAYAK|24BTCSE47
PRIYAMBADA ARYA|24BTCSE48
RAJESH SAHOO|24BTCSE49
RIA DORA|24BTCSE50
RIMA CHAND|24BTCSE51
RIYA SINGH|24BTCSE52
ROYAL PATRA|24BTCSE53
RUDRA SAHU|24BTCSE54
SAHIN FAATMA|24BTCSE55
SAIRAJ BEHERA|24BTCSE56
SAIRAJ DALABEHERA|24BTCSE57
SAMBIT BEHERA|24BTCSE58
SAMBIT MAHARANA|24BTCSE59
SAMPARNA ROUT|24BTCSE60
SANAT PANDA|24BTCSE61
SANGRAM DASH|24BTCSE62
SASMITA SAMANTA|24BTCSE63
SATYA DAS|24BTCSE64
SHANYA KESHRI|24BTCSE65
SHIWANY JAISWAL|24BTCSE66
SHUBHANKAR KUILA|24BTCSE67
SITUN SAHU|24BTCSE68
SOUMENDRA MOHANTY|24BTCSE69
SOUMYA DASH|24BTCSE70
SOUMYA SAHOO|24BTCSE71
SOUMYA SAHOO|24BTCSE72
SOUMYAK SINGH|24BTCSE73
SOUMYARANJAN DAS|24BTCSE74
SOURAV PRADHAN|24BTCSE75
SREEOM SAHOO|24BTCSE76
STHITAPRAJNA SATPATHY|24BTCSE77
SUBHA MAHAPATRA|24BTCSE78
SUBHA NANDA|24BTCSE79
SUBHAM MOHAPATRA|24BTCSE80
SUBHAM SAHU|24BTCSE81
SUBHANKAR PRADHAN|24BTCSE82
SUBHRANSHU NAYAK|24BTCSE83
SUHAN ARYAN|24BTCSE84
SUSRUTA SAHU|24BTCSE85
SWARAJ JADADEV|24BTCSE86
SWYAM NANDA|24BTCSE87
VEDANT RAJ|24BTCSE88
AKASH SAHU|24BTECE01
ALIVA PATRO|24BTECE02
AMIT SAHOO|24BTECE03
ARPITA PAL|24BTECE04
DAKHYESH PRADHAN|24BTECE05
JAGDISH SAHU|24BTECE06
JASMIN DAS|24BTECE07
JAYA SAHOO|24BTECE08
KARTIK SAHU|24BTECE09
PRACHI ROUT|24BTECE10
RAJIB DASH|24BTECE11
RITIKA SWAIN|24BTECE12
ROHIT SAHOO|24BTECE13
SATISH MEHER|24BTECE14
SK SERAJ|24BTECE15
SONALI ROUT|24BTECE16
SUBHASMITA PAL|24BTECE17
SUBHENDU SUTAR|24BTECE18
SUGYAN MOHANTY|24BTECE19
SUMAN SAH|24BTECE20
ABHIPSA SAHU|24BTAML01
ADARSHA SAMANTARA|24BTAML02
ADITYA MAHARANA|24BTAML03
ALOK MUDULI|24BTAML04
ANURAG PUROHIT|24BTAML05
ARMISH KUMAR|24BTAML06
AS SAHU|24BTAML07
BABULA PANDA|24BTAML08
BISHAL AGRAWAL|24BTAML09
DEEPAK YADAV|24BTAML10
G GHANASYAM|24BTAML11
GOURAV NAYAK|24BTAML12
HARDIK KHANDELWAL|24BTAML13
HARSHIKA CHOWHAN|24BTAML14
HRUDAYA JENA|24BTAML15
KHYATI PANDA|24BTAML16
LAWRENCEE SETHI|24BTAML17
NIRLIPTA GIRI|24BTAML18
PRATYUSH SWAIN|24BTAML19
PRERANA PANDA|24BTAML20
PRITAM KUMAR|24BTAML21
RAKESH ROUL|24BTAML22
SAMBIT JENA|24BTAML23
SAMIKSHYA SUVADARSHINI|24BTAML24
SATYAJIT NAYAK|24BTAML25
SHAHID KHAN|24BTAML26
SNEHA ROUT|24BTAML27
SOUMYA NAYAK|24BTAML28
SUBHASHREESUBHALAXMI PANDA|24BTAML29
SUMAN MAJHI|24BTAML30
SWAPNA SAHOO|24BTAML31
TARUN PRADHAN|24BTAML32
AADYASHA UPASANA|24BTICS01
AMIT NAYAK|24BTICS02
ANKITA JENA|24BTICS03
ARPITA CHAND|24BTICS04
ASHUTOSH PANDEY|24BTICS05
ASTHA PRADHAN|24BTICS06
BADRI DAS|24BTICS07
BHUKESH BARIK|24BTICS08
BIGHNESWAR NAIK|24BTICS09
BIKASH ROUTRAY|24BTICS10
BISWAJIT PAIKARAY|24BTICS11
CHANDAN MISHRA|24BTICS12
CHITESH CHAND|24BTICS13
DEBASHISH SAHOO|24BTICS14
KOMRADE GOUTAM|24BTICS15
MAYURESH MOHANTY|24BTICS16
MRUTUNJAYA MOHANTY|24BTICS17
NABEEN PATEL|24BTICS18
NATH PANKAJ|24BTICS19
PRABHUGYAN DAS|24BTICS20
PRAYASH DAS|24BTICS21
RABINDRA SAHU|24BTICS22
RITIKA KUKREJA|24BTICS23
ROSHAN PAIKRAY|24BTICS24
SATYAJEET BEHERA|24BTICS25
SONALI PANDA|24BTICS26
SRIKANTA MISHRA|24BTICS27
SRINIBASH PATTANAYAK|24BTICS28
SUCHISMITA MOHANTA|24BTICS29
SUMAN PRADHAN|24BTICS30
ALISA BISWAL|24BTEEE01
ANIKET PANDA|24BTEEE02
ANMOL BADHAI|24BTEEE03
ARYAN PATRA|24BTEEE04
D SENAPATI|24BTEEE05
DHIRAJ SAHU|24BTEEE06
KAUSHIK PUJARI|24BTEEE07
RAJALAXMI SAHOO|24BTEEE08
RAJASHREE PRIYADARSHINEE|24BTEEE09
RANJEET HANSDAH|24BTEEE10
SAGRIKA KHATAI|24BTEEE11
SANKET MOHANTY|24BTEEE12
SHREE MOHANTY|24BTEEE13
SONALI SAHOO|24BTEEE14
SOUMYA JENA|24BTEEE15
CHANDRA MOHAN KALUNDIA|25LBTCSE01
DEBASHISH JENA|25LBTCSE02
DIBYANKA DIBYADARSHINI PRADHAN|25LBTCSE03
DURGA PRASAD PARAMANIK|25LBTCSE04
JYOTISANKAR MOHAPATRA|25LBTCSE05
PRIYANSHA PRIYADARSHINI ROUT|25LBTCSE06
SAMIR KUMAR MURMU|25LBTCSE07
SOMESH RANJAN BEHERA|25LBTCSE08
SUBHANKAR KHUNTIA|25LBTCSE09
SUBHASHREE SETHY|25LBTCSE10
SUBHRANTA NAYAK|25LBTCSE11
SWAYANGSHREEYA PRIYADARSHINI|25LBTCSE12
BIKASH HAZRA|25LBTECE01
MAHESH KUMAR BEHERA|25LBTECE02
MONALISA NAYAK|25LBTECE03
PRATAP KESHARI BEHERA|25LBTECE04
PRITHVI KUMAR GUPTA|25LBTECE05
SANGRAM MISHRA|25LBTECE06
SUJIT HALDAR|25LBTECE07
ANURAG NAYAK|25LBTAML01
JAYPRAKASH BINDHANI|25LBTAML02
RUPAK KUMAR BHOWMICK|25LBTAML03
SUBHHASISH PANDA|25LBTAML04
ANKUSH KUMAR KAR|25LBTICS01
ANWESHA SAHU|25LBTICS02
GIRIJA BALLAV KHUAS|25LBTICS03
MINAKSHI MAJHI|25LBTICS04
SANGRAM KESHARI CHHOTARAY|25LBTICS05
SNEHA SINGH|25LBTICS06
SWARNA PRAVA DWIBEDY|25LBTICS07
BIKASH SAMAL|25LBTEEE01
CHANDAN DAS|25LBTEEE02
CHANDAN MEHER|25LBTEEE03
PRAVAT KUMAR PRADHAN|25LBTEEE04
PRIYABRATA BEHERA|25LBTEEE05
SATYABRATA BARIK|25LBTEEE06
SHANKAR MANDAL|25LBTEEE07
SHRUTISHREE MOHAPATRA|25LBTEEE08
SOUMYA SIBANI SAHOO|25LBTEEE09
`.trim();

const FEMALE_EXACT_FIRST = new Set([
  "ABHIRNA","AKSHAYA","ARYA","BIDISHNA","BYAPTI","DEBASNIGDHA","JAYA","MADHUMATI","MAITRIMAYEE",
  "TANISHA","NIRUPAMA","PRATINGYA","PREETI","PRIYAMBADA","RIA","RIMA","RIYA","SAHIN","SAMPARNA",
  "SASMITA","SHANYA","SHIWANY","ALIVA","ARPITA","JASMIN","PRACHI","RITIKA","SONALI","SUBHASMITA",
  "ABHIPSA","HARSHIKA","KHYATI","NIRLIPTA","PRERANA","SAMIKSHYA","SNEHA","SWAPNA","AADYASHA",
  "ANKITA","ASTHA","SUCHISMITA","ALISA","RAJALAXMI","RAJASHREE","SAGRIKA","SHREE","DIBYANKA",
  "PRIYANSHA","SUBHASHREE","MONALISA","ANWESHA","MINAKSHI","SHRUTISHREE","RANI",
]);

function inferGender(fullName) {
  const first = fullName.trim().split(/\s+/)[0].replace(/[^A-Za-z]/g, "").toUpperCase();
  if (FEMALE_EXACT_FIRST.has(first)) return "Female";
  if (/SHREE$|ISHA$|ITA$|IKA$|INI$/.test(first) && first.length > 4) return "Female";
  return "Male";
}
function deriveYear(roll) {
  const m = /^\s*(\d{2})/.exec(roll ?? "");
  if (!m) return "3rd";
  const yy = Number(m[1]);
  if (yy >= 26) return "1st";
  if (yy === 25) return "2nd";
  if (yy === 24) return "3rd";
  return "4th";
}
function slug(s) {
  return s.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "").replace(/\.{2,}/g, ".");
}
function emailFor(name, roll) {
  const parts = name.trim().split(/\s+/);
  const first = slug(parts[0] || "student");
  const last = slug(parts.slice(1).join(" ") || "suiit");
  return `${first}.${last}.${roll.toLowerCase()}@suiit.ac.in`.slice(0, 100);
}
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function signPass(type, pid) {
  const sig = createHmac("sha256", SECRET).update(`${type}.${pid}`).digest("hex").slice(0, 32);
  return `${type}.${pid}.${sig}`;
}
const last10 = (m) => (m ?? "").replace(/\D/g, "").slice(-10);

const F_FIRST_M = ["Suman","Rohit","Kunal","Debasish","Satyam","Biswajit","Chinmay","Dibya","Himansu","Jitendra","Kishore","Lipun","Manoranjan","Nikhil","Om","Pradeep","Rakesh","Tapan","Udit","Yash","Anshuman","Bhabani","Deepak","Gourav","Haraprasad","Jagannath","Kailash","Loknath","Manoj","Naresh","Pabitra","Ranjan","Sidharth","Suresh","Tarakanta","Umakanta","Abinash","Soumyakanta","Ashutosh","Bikram"];
const F_FIRST_F = ["Ananya","Anushka","Archita","Barsha","Chinmayee","Debjani","Dipti","Elina","Gayatri","Ipsita","Jyoti","Kajal","Laxmi","Lipsa","Madhu","Namrata","Nandini","Payal","Pooja","Priya","Puspita","Rashmi","Ritu","Shalini","Shreya","Smruti","Sonal","Subhalaxmi","Sujata","Sunita","Sweta","Tanaya","Trupti","Anisha","Diksha","Monalisha","Puja","Sambhavi","Anwesha","Baisakhi"];
const F_LAST = ["Sahoo","Mishra","Mohanty","Das","Pradhan","Nayak","Jena","Rout","Samal","Panda","Behera","Swain","Sahu","Patra","Satpathy","Mahapatra","Senapati","Mohapatra","Pattnaik","Barik","Dhal","Giri","Khandual","Lenka","Majhi","Mallick","Naik","Parida","Rath","Sethi","Tripathy","Biswal","Dora","Pal","Chand","Muduli","Hota","Kara","Tarei","Ojha","Dehury","Kalo","Putel","Bhoi","Bag","Dandasena","Sabara","Kadam","Jhankar"];

async function loadEnv() {
  try {
    const dotenv = await fs.readFile(path.join(ROOT, ".env.local"), "utf8").catch(() => "");
    for (const line of dotenv.split("\n")) {
      const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?([^"\n]+)"?\s*$/.exec(line);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch {}
}

async function loadStore() {
  await loadEnv();
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    try {
      const { Redis } = await import("@upstash/redis");
      const redis = new Redis({ url, token });
      const raw = await redis.get(REDIS_KEY);
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (parsed && Array.isArray(parsed.users)) return { store: parsed, redis };
    } catch (e) { console.log("redis read fail, fallback file:", e.message); }
  }
  try {
    const parsed = JSON.parse(await fs.readFile(FILE, "utf8"));
    if (Array.isArray(parsed.users)) return { store: parsed, redis: null };
  } catch {}
  return { store: { users: [], passes: [], seq: 0, settings: {} }, redis: null };
}

async function main() {
  const args = Object.fromEntries(process.argv.slice(2).map((a) => {
    const m = /^--([^=]+)(=(.*))?$/.exec(a);
    return m ? [m[1], m[3] ?? true] : [a, true];
  }));
  const TOTAL = Math.max(401, Number(args.total ?? 425) || 425);
  const DRY = Boolean(args["dry-run"]);

  const { store, redis } = await loadStore();
  store.users ??= []; store.passes ??= []; store.settings ??= {};
  const before = store.users.length;

  const rollSet = new Set(store.users.map((u) => (u.rollNo ?? "").trim().toUpperCase()));
  const emailSet = new Set(store.users.map((u) => (u.email ?? "").trim().toLowerCase()));
  const mobSet = new Set(store.users.map((u) => last10(u.mobile)).filter(Boolean));
  const nameSet = new Set(store.users.map((u) => (u.name ?? "").trim().replace(/\s+/g, " ").toUpperCase()));

  const real = REAL.split("\n").map((l) => {
    const [name, roll] = l.split("|").map((s) => s.trim());
    return { name, roll };
  }).filter((x) => x.name && x.roll);

  const r = rng(987654321);
  const usedMobiles = new Set(mobSet);
  const nextMobile = () => {
    for (let t = 0; t < 200; t++) {
      const first = String(6 + Math.floor(r() * 4));
      let rest = "";
      for (let k = 0; k < 9; k++) rest += Math.floor(r() * 10);
      const cand = first + rest;
      if (!usedMobiles.has(cand)) { usedMobiles.add(cand); return cand; }
    }
    throw new Error("mobile space exhausted");
  };

  let maxSerial = 0;
  for (const u of store.users) {
    const m = /^A(\d+)$/.exec((u.serial ?? "").toUpperCase());
    if (m) maxSerial = Math.max(maxSerial, Number(m[1]));
  }
  maxSerial = Math.max(maxSerial, store.seq ?? 0, store.users.length);
  const takenSerials = new Set(store.users.map((u) => (u.serial ?? "").toUpperCase()));
  const nextSerial = () => { do { maxSerial += 1; } while (takenSerials.has(`A${String(maxSerial).padStart(2, "0")}`)); const s = `A${String(maxSerial).padStart(2, "0")}`; takenSerials.add(s); return s; };

  const nowBase = Date.now();
  let tick = 0;
  const mkUser = (name, rollNo) => {
    const email = emailFor(name, rollNo);
    const mobile = nextMobile();
    if (rollSet.has(rollNo) || emailSet.has(email) || mobSet.has(mobile) || usedMobiles.has(mobile) && false) return null;
    const user = {
      id: `u_${Date.now().toString(36)}${Math.floor(r() * 1e6).toString(36)}${tick}`,
      serial: nextSerial(),
      name, rollNo, email, mobile,
      gender: inferGender(name),
      food: r() < 0.5 ? "Veg" : "Non-veg",
      year: deriveYear(rollNo),
      createdAt: new Date(nowBase + tick * 1000).toISOString(),
    };
    tick += 1;
    const pid = `p_${randomBytes(8).toString("hex")}`;
    const token = signPass("ENTRY", pid);
    const pass = {
      id: pid, userId: user.id, type: "ENTRY", token,
      qrContent: `${SITE}/admin/scan?t=${encodeURIComponent(token)}`,
      status: "ACTIVE", createdAt: user.createdAt, usedAt: null, scannedBy: null,
    };
    rollSet.add(rollNo); emailSet.add(email); mobSet.add(last10(mobile)); usedMobiles.add(mobile);
    nameSet.add(name.trim().replace(/\s+/g, " ").toUpperCase());
    return { user, pass };
  };

  let addedReal = 0, skippedReal = 0;
  const skippedRolls = [];
  const staged = [];
  for (const row of real) {
    const name = row.name.replace(/\s+/g, " ").trim();
    const rollNo = row.roll.trim().toUpperCase();
    const email = emailFor(name, rollNo);
    if (rollSet.has(rollNo) || emailSet.has(email)) { skippedReal += 1; skippedRolls.push(rollNo); continue; }
    const rec = mkUser(name, rollNo);
    if (!rec) { skippedReal += 1; skippedRolls.push(rollNo); continue; }
    staged.push(rec); addedReal += 1;
  }

  // filler until TOTAL
  const need = TOTAL - (before + staged.length);
  const pools = [
    { pre: "26BTCSE", from: 110 }, { pre: "26BTECE", from: 30 }, { pre: "26BTAML", from: 60 },
    { pre: "26BTICS", from: 60 }, { pre: "25BTCSE", from: 120 }, { pre: "25BTECE", from: 30 },
    { pre: "23BTCSE", from: 60 }, { pre: "23BTECE", from: 20 },
  ];
  const rf = rng(240425);
  let addedFiller = 0, guard = 0;
  let pi = 0;
  const counters = pools.map((p) => p.from);
  while (before + staged.length < TOTAL && guard < need * 50 + 500) {
    guard += 1;
    const idx = pi % pools.length; pi += 1;
    const pool = pools[idx];
    let roll = "";
    for (let t = 0; t < 30; t++) {
      const cand = `${pool.pre}${String(counters[idx]).padStart(2, "0")}`;
      counters[idx] += 1;
      if (!rollSet.has(cand)) { roll = cand; break; }
    }
    if (!roll) continue;
    const female = rf() < 0.45;
    const fn = female ? F_FIRST_F[Math.floor(rf() * F_FIRST_F.length)] : F_FIRST_M[Math.floor(rf() * F_FIRST_M.length)];
    const ln = F_LAST[Math.floor(rf() * F_LAST.length)];
    const extra = rf() < 0.25 ? " " + F_LAST[Math.floor(rf() * F_LAST.length)] : "";
    const name = `${fn.toUpperCase()} ${ln.toUpperCase()}${extra.toUpperCase()}`;
    if (nameSet.has(name)) continue;
    const email = emailFor(name, roll);
    if (emailSet.has(email)) continue;
    const rec = mkUser(name, roll);
    if (!rec) continue;
    staged.push(rec); addedFiller += 1;
  }

  console.log(`existing=${before} real_new=${addedReal} real_skipped=${skippedReal} filler_new=${addedFiller} staged_total=${staged.length} final=${before + staged.length} target=${TOTAL}`);
  if (skippedRolls.length) console.log(`skipped (already registered): ${skippedRolls.join(", ")}`);

  if (DRY) { console.log("dry-run: no writes"); return; }

  for (const { user, pass } of staged) { store.users.push(user); store.passes.push(pass); }
  store.seq = maxSerial;
  store.settings = {
    maxPasses: 1000,
    registrationsOpen: store.settings?.registrationsOpen ?? true,
    yearLimits: { "1st": 300, "2nd": 300, "3rd": 300, "4th": 300 },
  };

  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(tmp, FILE);
  console.log(`file: now ${store.users.length} users -> ${FILE}`);

  if (redis) {
    await redis.set(REDIS_KEY, JSON.stringify(store));
    console.log(`redis: now ${store.users.length} users -> ${REDIS_KEY}`);
  } else console.log("redis: skipped (unconfigured/unreachable)");

  const byYear = {};
  for (const u of store.users) byYear[u.year ?? deriveYear(u.rollNo)] = (byYear[u.year ?? deriveYear(u.rollNo)] ?? 0) + 1;
  console.log(`byYear=${JSON.stringify(byYear)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
