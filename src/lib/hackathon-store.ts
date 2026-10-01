import { promises as fs } from "fs";
import path from "path";
import { YEARS, GENDERS, deriveYearFromRollNo, normalizeEmail, normalizeMobile, collapseSpaces, type Year, type FoodPref, type Gender } from "./validate-contact";
import { getRedis, withRedisLock } from "./pass-redis";

export const HACKATHON_MIN_MEMBERS = 4; // leader + 3 teammates, exact
export const HACKATHON_MAX_MEMBERS = 4; // leader + 3 teammates, exact

export type HackathonPreference = "Hardware" | "Software" | "Both";
export const HACKATHON_PREFERENCES: HackathonPreference[] = ["Hardware", "Software", "Both"];

export interface HackathonMemberInput {
  name: string;
  rollNo: string;
  email: string;
  mobile: string;
  year: string;
  gender: string;
  githubUrl: string;
}

export interface HackathonTeamInput {
  teamName: string;
  preference: string;
  declaration: boolean;
  leader: HackathonMemberInput;
  members: HackathonMemberInput[];
}

export interface HackathonMember {
  name: string;
  rollNo: string;
  email: string;
  mobile: string;
  year: Year;
  gender: Gender;
  githubUrl: string;
  /** Legacy: food was collected before it moved to the SCD pass. */
  food?: FoodPref;
}

export interface HackathonTeam {
  id: string;
  teamName: string;
  preference: HackathonPreference;
  leader: HackathonMember;
  members: HackathonMember[];
  createdAt: string;
}

interface HackathonStoreShape {
  teams: HackathonTeam[];
}

const FILE = path.join(process.cwd(), ".data-hackathon", "hackathon.json");
const REDIS_KEY = "sbg:hackathon:v1";
const REDIS_LOCK = "sbg:hackathon:lock";

const NAME_RE = /^[A-Za-z][A-Za-z.'\- ]*$/;
const ROLL_RE = /^[A-Za-z0-9][A-Za-z0-9/.\- ]{2,19}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TEAM_RE = /^[A-Za-z0-9][A-Za-z0-9 .'\-_]{1,38}[A-Za-z0-9]$/;

function emptyStore(): HackathonStoreShape {
  return { teams: [] };
}

function parseStore(raw: unknown): HackathonStoreShape {
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as HackathonStoreShape;
      if (Array.isArray(parsed.teams)) return parsed;
    } catch {
      // fall through
    }
    return emptyStore();
  }
  if (typeof raw === "object" && raw !== null && Array.isArray((raw as HackathonStoreShape).teams)) {
    return raw as HackathonStoreShape;
  }
  return emptyStore();
}

async function readStore(): Promise<HackathonStoreShape> {
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

async function writeStore(store: HackathonStoreShape): Promise<void> {
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

/** Thrown on duplicate team name / member. Maps to 409. */
export class HackathonConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HackathonConflictError";
  }
}

/** Thrown when team cap reached. Maps to 403. */
export class HackathonFullError extends Error {
  constructor(limit: number) {
    super(`Hackathon registrations are full — all ${limit} team slots claimed.`);
    this.name = "HackathonFullError";
  }
}

/** Team cap (overridable via HACKATHON_MAX_TEAMS). */
export function maxHackathonTeams(): number {
  const n = Number(process.env.HACKATHON_MAX_TEAMS ?? 25);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 25;
}

export type MemberErrors = {
  name?: string;
  rollNo?: string;
  email?: string;
  mobile?: string;
  year?: string;
  gender?: string;
  githubUrl?: string;
};

export interface TeamErrors {
  teamName?: string;
  preference?: string;
  declaration?: string;
  leader?: MemberErrors;
  members?: MemberErrors[];
  team?: string;
}

function validateMember(m: HackathonMemberInput, opts?: { githubRequired?: boolean }): MemberErrors {
  const errors: MemberErrors = {};
  const name = collapseSpaces(m.name ?? "");
  if (!name) errors.name = "Name required.";
  else if (name.length < 2) errors.name = "Enter full name.";
  else if (name.length > 60) errors.name = "Name too long (max 60).";
  else if (!NAME_RE.test(name)) errors.name = "Letters, spaces ( . ' - ) only.";

  const roll = String(m.rollNo ?? "").trim().toUpperCase();
  if (!roll) errors.rollNo = "Roll number required.";
  else if (roll.length > 20) errors.rollNo = "Roll number too long.";
  else if (!ROLL_RE.test(roll)) errors.rollNo = "Enter a valid roll number.";

  const email = normalizeEmail(String(m.email ?? ""));
  if (!email) errors.email = "College mail required.";
  else if (email.length > 100) errors.email = "Email too long.";
  else if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email.";
  else if (!email.endsWith("@suiit.ac.in")) errors.email = "Use SUIIT mail (@suiit.ac.in).";

  const mobile = normalizeMobile(String(m.mobile ?? ""));
  if (!mobile) errors.mobile = "Mobile required.";
  else if (!/^[6-9]\d{9}$/.test(mobile)) errors.mobile = "Enter a valid 10-digit Indian mobile.";

  const year = String(m.year ?? "");
  if (!YEARS.includes(year as Year)) {
    const derived = deriveYearFromRollNo(String(m.rollNo ?? ""));
    if (!derived) errors.year = "Select year.";
  }

  if (!GENDERS.includes(m.gender as Gender)) errors.gender = "Pick Male or Female.";

  const github = String(m.githubUrl ?? "").trim();
  if (!github) {
    if (opts?.githubRequired) errors.githubUrl = "Leader GitHub profile URL is required.";
  } else if (github.length > 200) {
    errors.githubUrl = "GitHub URL too long.";
  } else {
    try {
      const u = new URL(github);
      if (u.protocol !== "http:" && u.protocol !== "https:") errors.githubUrl = "Enter a valid URL.";
      else if (!u.hostname.toLowerCase().includes("github.com")) errors.githubUrl = "Must be a github.com URL.";
    } catch {
      errors.githubUrl = "Enter full URL (https://github.com/…).";
    }
  }
  return errors;
}

export function validateTeam(input: HackathonTeamInput): TeamErrors {
  const errors: TeamErrors = {};
  const teamName = collapseSpaces(input.teamName ?? "");
  if (!teamName) errors.teamName = "Team name is required.";
  else if (teamName.length < 3) errors.teamName = "Team name too short (min 3).";
  else if (teamName.length > 40) errors.teamName = "Team name too long (max 40).";
  else if (!TEAM_RE.test(teamName)) errors.teamName = "Letters, numbers, spaces ( . ' - _ ) only.";

  if (!HACKATHON_PREFERENCES.includes(input.preference as HackathonPreference)) {
    errors.preference = "Pick Hardware, Software or Both.";
  }
  if (input.declaration !== true) {
    errors.declaration = "Please accept the declaration to register.";
  }

  const leaderErr = validateMember(input.leader ?? ({} as HackathonMemberInput), { githubRequired: true });
  if (Object.keys(leaderErr).length > 0) errors.leader = leaderErr;

  const members = Array.isArray(input.members) ? input.members : [];
  if (members.length + 1 !== HACKATHON_MAX_MEMBERS) {
    errors.team = `Team must have exactly ${HACKATHON_MAX_MEMBERS} members (leader + ${HACKATHON_MAX_MEMBERS - 1} teammates).`;
  }
  const memberErrs = members.map((m) => validateMember(m));
  if (memberErrs.some((e) => Object.keys(e).length > 0)) errors.members = memberErrs;
  return errors;
}

function normalizeMember(m: HackathonMemberInput): HackathonMember {
  const rawYear = String(m.year ?? "");
  const resolved: Year =
    (YEARS.includes(rawYear as Year) ? (rawYear as Year) : deriveYearFromRollNo(String(m.rollNo ?? ""))) ?? "1st";
  return {
    name: collapseSpaces(m.name ?? ""),
    rollNo: String(m.rollNo ?? "").trim().toUpperCase(),
    email: normalizeEmail(String(m.email ?? "")),
    mobile: normalizeMobile(String(m.mobile ?? "")),
    year: resolved,
    gender: (GENDERS.includes(m.gender as Gender) ? m.gender : "Male") as Gender,
    githubUrl: String(m.githubUrl ?? "").trim(),
  };
}

function allPeople(team: { leader: HackathonMember; members: HackathonMember[] }): HackathonMember[] {
  return [team.leader, ...team.members];
}

export async function hackathonCount(): Promise<{ registered: number; limit: number; open: boolean }> {
  const store = await readStore();
  const limit = maxHackathonTeams();
  return { registered: store.teams.length, limit, open: store.teams.length < limit };
}

export async function registerTeam(input: HackathonTeamInput): Promise<{ team: HackathonTeam }> {
  return withWriteLock(async () => {
    const store = await readStore();
    const teamName = collapseSpaces(input.teamName ?? "");
    if (store.teams.some((t) => t.teamName.toLowerCase() === teamName.toLowerCase())) {
      throw new HackathonConflictError(`Team name "${teamName}" is already taken — pick another.`);
    }
    const leader = normalizeMember(input.leader);
    const members = (Array.isArray(input.members) ? input.members : []).map(normalizeMember);
    // one student = one team
    const seen = new Map<string, string>(); // contact key -> who
    const claim = (who: string, email: string, roll: string, mobile: string) => {
      for (const [key, label] of [["e:" + email, "email"], ["r:" + roll, "roll number"], ["m:" + mobile, "mobile"]] as const) {
        if (seen.has(key)) throw new HackathonConflictError(`${who} and ${seen.get(key)} share the same ${label} — each member must be unique.`);
        seen.set(key, who);
      }
    };
    claim(`${leader.name} (leader)`, leader.email, leader.rollNo, leader.mobile);
    members.forEach((m) => claim(m.name, m.email, m.rollNo, m.mobile));
    for (const t of store.teams) {
      for (const p of allPeople({ leader, members })) {
        const clash = allPeople(t).find(
          (q) => q.email === p.email || q.rollNo === p.rollNo || (p.mobile !== "" && q.mobile === p.mobile),
        );
        if (clash) {
          throw new HackathonConflictError(
            `${p.name} is already registered with team "${t.teamName}" — one student, one team.`,
          );
        }
      }
    }
    const limit = maxHackathonTeams();
    if (store.teams.length >= limit) throw new HackathonFullError(limit);
    const now = new Date().toISOString();
    const preference = HACKATHON_PREFERENCES.includes(input.preference as HackathonPreference)
      ? (input.preference as HackathonPreference)
      : "Both";
    const team: HackathonTeam = {
      id: `h_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`,
      teamName,
      preference,
      leader,
      members,
      createdAt: now,
    };
    store.teams.push(team);
    await writeStore(store);
    return { team };
  });
}

export interface HackathonTeamPatch {
  teamName?: string;
  preference?: string;
  leader?: HackathonMemberInput;
  members?: HackathonMemberInput[];
}

/** Admin edit: full-team validate + duplicate check (excluding self). */
export async function updateHackathonTeam(id: string, patch: HackathonTeamPatch): Promise<{ team: HackathonTeam }> {
  return withWriteLock(async () => {
    const store = await readStore();
    const team = store.teams.find((t) => t.id === id);
    if (!team) throw new Error("Team not found.");
    const toInput = (m: HackathonMember): HackathonMemberInput => ({
      name: m.name,
      rollNo: m.rollNo,
      email: m.email,
      mobile: m.mobile,
      year: m.year,
      gender: m.gender,
      githubUrl: m.githubUrl ?? "",
    });
    const merged = {
      teamName: patch.teamName !== undefined ? patch.teamName : team.teamName,
      preference: patch.preference !== undefined ? patch.preference : team.preference,
      declaration: true,
      leader: patch.leader !== undefined ? patch.leader : toInput(team.leader),
      members: patch.members !== undefined ? patch.members : team.members.map(toInput),
    };
    const errors = validateTeam(merged);
    if (Object.keys(errors).length > 0) {
      const first = errors.teamName ?? errors.preference ?? errors.declaration ?? errors.team ?? "Validation failed.";
      throw new HackathonConflictError(typeof first === "string" ? first : "Validation failed.");
    }
    const teamName = collapseSpaces(merged.teamName);
    if (store.teams.some((t) => t.id !== id && t.teamName.toLowerCase() === teamName.toLowerCase())) {
      throw new HackathonConflictError(`Team name "${teamName}" is already taken — pick another.`);
    }
    const leader = normalizeMember(merged.leader);
    const members = merged.members.map(normalizeMember);
    for (const p of allPeople({ leader, members })) {
      const clash = store.teams
        .filter((t) => t.id !== id)
        .flatMap((t) => allPeople(t).map((q) => ({ q, t })))
        .find(({ q }) => q.email === p.email || q.rollNo === p.rollNo || (p.mobile !== "" && q.mobile === p.mobile));
      if (clash) {
        throw new HackathonConflictError(
          `${p.name} is already registered with team "${clash.t.teamName}" — one student, one team.`,
        );
      }
    }
    team.teamName = teamName;
    team.preference = HACKATHON_PREFERENCES.includes(merged.preference as HackathonPreference)
      ? (merged.preference as HackathonPreference)
      : team.preference;
    team.leader = leader;
    team.members = members;
    await writeStore(store);
    return { team };
  });
}

/** Admin/owner remove: deletes the whole team. */
export async function deleteHackathonTeam(id: string): Promise<{ removedMembers: number }> {
  return withWriteLock(async () => {
    const store = await readStore();
    const team = store.teams.find((t) => t.id === id);
    if (!team) throw new Error("Team not found.");
    store.teams = store.teams.filter((t) => t.id !== id);
    await writeStore(store);
    return { removedMembers: 1 + team.members.length };
  });
}

export async function listHackathonTeams(): Promise<{ teams: HackathonTeam[]; total: number }> {  const store = await readStore();
  const teams = [...store.teams].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { teams, total: teams.length };
}
