import { promises as fs } from "fs";
import { randomUUID } from "crypto";
import path from "path";
import {
  coordinators,
  domainLeads,
  opsTeam,
  teamLeads,
  type TeamMember,
} from "@/data/team";
import { getRedis, withRedisLock } from "./pass-redis";

export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface TeamSubmission {
  id: string;
  name: string;
  role: string;
  section: string;
  photoDataUrl: string;
  status: SubmissionStatus;
  createdAt: string;
  reviewedAt: string | null;
}

interface TeamSubmissionStore {
  submissions: TeamSubmission[];
}

export const TEAM_SECTIONS = [
  { key: "leadership", title: "Leadership", roles: teamLeads.map((m) => m.role) },
  { key: "domain", title: "Domain leads", roles: domainLeads.map((m) => m.role) },
  { key: "ops", title: "Events, PR & media", roles: opsTeam.map((m) => m.role) },
  { key: "coordinators", title: "Co-ordinators", roles: coordinators.map((m) => m.role) },
] as const;

export type TeamSectionKey = (typeof TEAM_SECTIONS)[number]["key"];

const FILE = path.join(process.cwd(), ".data-team", "team-submissions.json");
const REDIS_KEY = "sbg:team-submissions:v1";
const REDIS_LOCK = "sbg:team-submissions:lock";

/** Max stored photo: 800x800 q0.85 JPEG ≈ 150-300KB → base64 ≈ 400KB. Cap at ~900KB chars. */
export const MAX_PHOTO_DATAURL_CHARS = 1_200_000;

const NAME_RE = /^[A-Za-z][A-Za-z.'\- ]*$/;

function emptyStore(): TeamSubmissionStore {
  return { submissions: [] };
}

function parseStore(raw: unknown): TeamSubmissionStore {
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as TeamSubmissionStore;
      if (Array.isArray(parsed.submissions)) return parsed;
    } catch {
      // fall through
    }
    return emptyStore();
  }
  if (typeof raw === "object" && raw !== null && Array.isArray((raw as TeamSubmissionStore).submissions)) {
    return raw as TeamSubmissionStore;
  }
  return emptyStore();
}

async function readStore(): Promise<TeamSubmissionStore> {
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

async function writeStore(store: TeamSubmissionStore): Promise<void> {
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

export function roleOptions(): { role: string; section: TeamSectionKey }[] {
  return TEAM_SECTIONS.flatMap((s) => s.roles.map((role) => ({ role, section: s.key as TeamSectionKey })));
}

export function sectionForRole(role: string): TeamSectionKey | null {
  const found = roleOptions().find((o) => o.role === role);
  return found ? found.section : null;
}

export interface SubmissionErrors {
  name?: string;
  role?: string;
  photo?: string;
}

export function validateSubmission(input: { name: string; role: string; photoDataUrl: string }): SubmissionErrors {
  const errors: SubmissionErrors = {};
  const name = input.name.trim().replace(/\s+/g, " ");
  if (!name) errors.name = "Full name is required.";
  else if (name.length < 2) errors.name = "Please enter your full name.";
  else if (name.length > 60) errors.name = "Name too long (max 60 characters).";
  else if (!NAME_RE.test(name)) errors.name = "Letters, spaces ( . ' - ) only.";
  if (!sectionForRole(input.role)) errors.role = "Select your position from the list.";
  if (!input.photoDataUrl.startsWith("data:image/jpeg;base64,")) {
    errors.photo = "Photo must be a square JPG — use the on-page cropper.";
  } else if (input.photoDataUrl.length > MAX_PHOTO_DATAURL_CHARS) {
    errors.photo = "Photo too large after processing. Retry.";
  }
  return errors;
}

export class TeamSubmissionError extends Error {
  errors: SubmissionErrors;
  constructor(errors: SubmissionErrors) {
    super("Validation failed.");
    this.name = "TeamSubmissionError";
    this.errors = errors;
  }
}

export async function createSubmission(input: { name: string; role: string; photoDataUrl: string }): Promise<TeamSubmission> {
  const name = input.name.trim().replace(/\s+/g, " ");
  const errors = validateSubmission({ name, role: input.role, photoDataUrl: input.photoDataUrl });
  if (Object.keys(errors).length > 0) throw new TeamSubmissionError(errors);
  const section = sectionForRole(input.role) ?? "ops";
  return withWriteLock(async () => {
    const store = await readStore();
    const sub: TeamSubmission = {
      id: randomUUID(),
      name,
      role: input.role,
      section,
      photoDataUrl: input.photoDataUrl,
      status: "pending",
      createdAt: new Date().toISOString(),
      reviewedAt: null,
    };
    store.submissions.unshift(sub);
    await writeStore(store);
    return sub;
  });
}

export async function listSubmissions(): Promise<TeamSubmission[]> {
  const store = await readStore();
  return [...store.submissions].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function setSubmissionStatus(id: string, status: SubmissionStatus): Promise<TeamSubmission> {
  return withWriteLock(async () => {
    const store = await readStore();
    const sub = store.submissions.find((s) => s.id === id);
    if (!sub) throw new Error("Submission not found.");
    sub.status = status;
    sub.reviewedAt = new Date().toISOString();
    await writeStore(store);
    return { ...sub };
  });
}

export async function listApproved(): Promise<TeamSubmission[]> {
  const store = await readStore();
  return store.submissions.filter((s) => s.status === "approved");
}

function toMember(s: TeamSubmission): TeamMember {
  return {
    id: `sub-${s.id}`,
    name: s.name,
    role: s.role,
    bio: "",
    photo: s.photoDataUrl,
  };
}

/**
 * Static team.ts lists merged with admin-approved submissions.
 * Name match (case-insensitive) overrides the static photo; otherwise appended to its section.
 */
export async function getTeamLists(): Promise<{
  teamLeads: TeamMember[];
  domainLeads: TeamMember[];
  opsTeam: TeamMember[];
  coordinators: TeamMember[];
}> {
  const approved = await listApproved();
  if (approved.length === 0) return { teamLeads, domainLeads, opsTeam, coordinators };
  const leads = teamLeads.map((m) => ({ ...m }));
  const domain = domainLeads.map((m) => ({ ...m }));
  const ops = opsTeam.map((m) => ({ ...m }));
  const coords = coordinators.map((m) => ({ ...m }));
  const bySection: Record<string, TeamMember[]> = {
    leadership: leads,
    domain,
    ops,
    coordinators: coords,
  };
  const norm = (v: string) => v.trim().toLowerCase();
  for (const s of approved) {
    const all = [...leads, ...domain, ...ops, ...coords];
    const existing = all.find((m) => norm(m.name) === norm(s.name));
    if (existing) {
      existing.photo = s.photoDataUrl;
      existing.role = s.role;
      continue;
    }
    bySection[s.section]?.push(toMember(s));
  }
  return { teamLeads: leads, domainLeads: domain, opsTeam: ops, coordinators: coords };
}
