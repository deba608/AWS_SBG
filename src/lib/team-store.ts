import { promises as fs } from "fs";
import { randomUUID } from "crypto";
import path from "path";
import {
  allMembers,
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
  /** Full pre-crop photo (bounded ~1280px) so admin can re-crop from scratch. */
  originalDataUrl?: string | null;
  linkedin?: string | null;
  github?: string | null;
  email?: string | null;
  status: SubmissionStatus;
  createdAt: string;
  reviewedAt: string | null;
}

interface TeamSubmissionStore {
  submissions: TeamSubmission[];
}

export const TEAM_SECTIONS = [
  { key: "leadership", title: "Leadership", roles: [...new Set(teamLeads.map((m) => m.role))] },
  { key: "domain", title: "Domain leads", roles: [...new Set(domainLeads.map((m) => m.role))] },
  { key: "ops", title: "Events, PR & media", roles: [...new Set(opsTeam.map((m) => m.role))] },
  { key: "coordinators", title: "Co-ordinators", roles: [...new Set(coordinators.map((m) => m.role))] },
] as const;

export type TeamSectionKey = (typeof TEAM_SECTIONS)[number]["key"];

const FILE = path.join(process.cwd(), ".data-team", "team-submissions.json");
const REDIS_KEY = "sbg:team-submissions:v1";
const REDIS_LOCK = "sbg:team-submissions:lock";

/** Max stored photo: 800x800 q0.85 JPEG ≈ 150-300KB → base64 ≈ 400KB. Cap at ~900KB chars. */
export const MAX_PHOTO_DATAURL_CHARS = 1_200_000;
/** Bounded original (~1280px q0.82) for admin re-crop. */
export const MAX_ORIGINAL_DATAURL_CHARS = 1_600_000;

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
  linkedin?: string;
  github?: string;
  email?: string;
}

export function normalizeUrl(value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}

export function normalizeEmail(value: string | null | undefined): string | null {
  const v = (value ?? "").trim().toLowerCase();
  return v ? v : null;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateLinks(input: { linkedin?: string | null; github?: string | null; email?: string | null }): SubmissionErrors {
  const errors: SubmissionErrors = {};
  const linkedin = normalizeUrl(input.linkedin);
  const github = normalizeUrl(input.github);
  const email = normalizeEmail(input.email);
  if (linkedin) {
    if (!isValidHttpUrl(linkedin) || linkedin.length > 300) {
      errors.linkedin = "Enter a valid LinkedIn URL.";
    } else if (!/linkedin\.com|lnkd\.in/i.test(linkedin)) {
      errors.linkedin = "That doesn't look like a LinkedIn URL.";
    }
  }
  if (github) {
    if (!isValidHttpUrl(github) || github.length > 300) {
      errors.github = "Enter a valid GitHub URL.";
    } else if (!/github\.com/i.test(github)) {
      errors.github = "That doesn't look like a GitHub URL.";
    }
  }
  if (email) {
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Enter a valid email address.";
    }
  }
  return errors;
}

export function rosterMember(name: string): TeamMember | null {
  const norm = name.trim().toLowerCase();
  return allMembers.find((m) => m.name.toLowerCase() === norm) ?? null;
}

export function validateSubmission(input: { name: string; role: string; photoDataUrl: string; originalDataUrl?: string | null; linkedin?: string | null; github?: string | null; email?: string | null }): SubmissionErrors {
  const errors: SubmissionErrors = {};
  const member = rosterMember(input.name);
  if (!member) errors.name = "Select your name from the team list.";
  if (!sectionForRole(input.role)) errors.role = "Select your position from the list.";
  // Empty photo is allowed here — createSubmission reuses the live photo for
  // links-only updates, or rejects when no live photo exists.
  if (input.photoDataUrl) {
    if (!input.photoDataUrl.startsWith("data:image/jpeg;base64,")) {
      errors.photo = "Photo must be a square JPG — use the on-page cropper.";
    } else if (input.photoDataUrl.length > MAX_PHOTO_DATAURL_CHARS) {
      errors.photo = "Photo too large after processing. Retry.";
    }
  }
  if (input.originalDataUrl != null && input.originalDataUrl !== "") {
    if (!input.originalDataUrl.startsWith("data:image/jpeg;base64,")) {
      errors.photo = "Original photo must be a JPG — re-upload.";
    } else if (input.originalDataUrl.length > MAX_ORIGINAL_DATAURL_CHARS) {
      errors.photo = "Original photo too large. Re-upload.";
    }
  }
  Object.assign(errors, validateLinks(input));
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

export async function createSubmission(input: { name: string; role: string; photoDataUrl: string; originalDataUrl?: string | null; linkedin?: string | null; github?: string | null; email?: string | null }): Promise<{ submission: TeamSubmission; updated: boolean }> {
  const member = rosterMember(input.name);
  const name = member ? member.name : input.name.trim().replace(/\s+/g, " ");
  const errors = validateSubmission({ name, role: input.role, photoDataUrl: input.photoDataUrl, originalDataUrl: input.originalDataUrl ?? null, linkedin: input.linkedin, github: input.github, email: input.email });
  if (Object.keys(errors).length > 0) throw new TeamSubmissionError(errors);
  const section = sectionForRole(input.role) ?? "ops";
  // Links-only update: no new upload → reuse the live photo. Reject when the
  // member has no live photo yet (first submission must include one).
  let livePhoto: string | null = null;
  if (!input.photoDataUrl) {
    const { member: live } = await getMemberProfile(name);
    if (!live?.photo) throw new TeamSubmissionError({ photo: "Upload a photo and finish cropping." });
    livePhoto = live.photo;
  }
  const norm = (v: string) => v.trim().toLowerCase();
  return withWriteLock(async () => {
    const store = await readStore();
    // Same person resubmits while a request is still pending → update it in
    // place instead of stacking duplicates. Admin reviews one row per member.
    const existing = store.submissions.find((s) => s.status === "pending" && norm(s.name) === norm(name));
    if (existing) {
      existing.role = input.role;
      existing.section = section;
      if (input.photoDataUrl) {
        existing.photoDataUrl = input.photoDataUrl;
        existing.originalDataUrl = input.originalDataUrl ?? null;
      }
      existing.linkedin = normalizeUrl(input.linkedin);
      existing.github = normalizeUrl(input.github);
      existing.email = normalizeEmail(input.email);
      existing.createdAt = new Date().toISOString();
      existing.reviewedAt = null;
      await writeStore(store);
      return { submission: { ...existing }, updated: true };
    }
    const sub: TeamSubmission = {
      id: randomUUID(),
      name,
      role: input.role,
      section,
      photoDataUrl: input.photoDataUrl || (livePhoto as string),
      originalDataUrl: input.photoDataUrl ? (input.originalDataUrl ?? null) : null,
      linkedin: normalizeUrl(input.linkedin),
      github: normalizeUrl(input.github),
      email: normalizeEmail(input.email),
      status: "pending",
      createdAt: new Date().toISOString(),
      reviewedAt: null,
    };
    store.submissions.unshift(sub);
    await writeStore(store);
    return { submission: sub, updated: false };
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

/** Admin re-crop: replace the stored square JPG photo. */
export async function updateSubmissionPhoto(id: string, photoDataUrl: string): Promise<TeamSubmission> {
  if (!photoDataUrl.startsWith("data:image/jpeg;base64,")) throw new Error("Photo must be a square JPG.");
  if (photoDataUrl.length > MAX_PHOTO_DATAURL_CHARS) throw new Error("Photo too large.");
  return withWriteLock(async () => {
    const store = await readStore();
    const sub = store.submissions.find((s) => s.id === id);
    if (!sub) throw new Error("Submission not found.");
    sub.photoDataUrl = photoDataUrl;
    await writeStore(store);
    return { ...sub };
  });
}

/** Admin edit links on a submission. Null/empty clears. Throws on invalid. */
export async function updateSubmissionLinks(id: string, links: { linkedin?: string | null; github?: string | null; email?: string | null }): Promise<TeamSubmission> {  const errors = validateLinks(links);
  if (Object.keys(errors).length > 0) {
    throw new Error(errors.linkedin ?? errors.github ?? errors.email ?? "Invalid links.");
  }
  return withWriteLock(async () => {
    const store = await readStore();
    const sub = store.submissions.find((s) => s.id === id);
    if (!sub) throw new Error("Submission not found.");
    if (links.linkedin !== undefined) sub.linkedin = normalizeUrl(links.linkedin);
    if (links.github !== undefined) sub.github = normalizeUrl(links.github);
    if (links.email !== undefined) sub.email = normalizeEmail(links.email);
    await writeStore(store);
    return { ...sub };
  });
}

export interface SubmissionDetailsInput {
  name?: string;
  role?: string;
  linkedin?: string | null;
  github?: string | null;
  email?: string | null;
}

/**
 * Admin full edit: rename member, change role (section derived), edit links.
 * Approved edits go live on /team instantly via name-matched override.
 * Throws Error with human message on invalid input, "Submission not found."
 * when the id is unknown.
 */
export async function updateSubmissionDetails(id: string, input: SubmissionDetailsInput): Promise<TeamSubmission> {
  const errors: SubmissionErrors = {};
  let name: string | undefined;
  if (input.name !== undefined) {
    const cleaned = input.name.trim().replace(/\s+/g, " ");
    if (!cleaned) errors.name = "Name cannot be empty.";
    else if (cleaned.length > 80) errors.name = "Name too long.";
    else name = rosterMember(cleaned)?.name ?? cleaned;
  }
  let role: string | undefined;
  let section: TeamSectionKey | undefined;
  if (input.role !== undefined) {
    const found = sectionForRole(input.role);
    if (!found) errors.role = "Select a valid position from the list.";
    else {
      role = input.role;
      section = found;
    }
  }
  const hasLinks = input.linkedin !== undefined || input.github !== undefined || input.email !== undefined;
  if (hasLinks) {
    Object.assign(
      errors,
      validateLinks({ linkedin: input.linkedin, github: input.github, email: input.email }),
    );
  }
  if (Object.keys(errors).length > 0) {
    throw new TeamSubmissionError(errors);
  }
  return withWriteLock(async () => {
    const store = await readStore();
    const sub = store.submissions.find((s) => s.id === id);
    if (!sub) throw new Error("Submission not found.");
    if (name !== undefined) sub.name = name;
    if (role !== undefined && section !== undefined) {
      sub.role = role;
      sub.section = section;
    }
    if (input.linkedin !== undefined) sub.linkedin = normalizeUrl(input.linkedin);
    if (input.github !== undefined) sub.github = normalizeUrl(input.github);
    if (input.email !== undefined) sub.email = normalizeEmail(input.email);
    await writeStore(store);
    return { ...sub };
  });
}

/** Admin delete: removes a submission entirely (e.g. spam, duplicate, ex-member). */
export async function deleteSubmission(id: string): Promise<void> {
  return withWriteLock(async () => {
    const store = await readStore();
    const idx = store.submissions.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("Submission not found.");
    store.submissions.splice(idx, 1);
    await writeStore(store);
  });
}

export interface AdminUpsertInput {
  /** Original name on /team — when renamed, old records are retired. */
  previousName?: string;
  name: string;
  role: string;
  /** Cropped square JPG. Omit/empty = keep live photo. */
  photoDataUrl?: string;
  /** Bounded pre-crop JPG for later re-crop. Omit = keep. */
  originalDataUrl?: string | null;
  linkedin?: string | null;
  github?: string | null;
  email?: string | null;
}

/**
 * Admin direct edit from /team: creates or updates the approved record for a
 * member in one call. Static-only members (no submission yet) get a new
 * approved record; photo stays untouched unless a fresh crop is supplied.
 */
export async function adminUpsertMember(input: AdminUpsertInput): Promise<TeamSubmission> {
  const norm = (v: string) => v.trim().toLowerCase();
  const cleaned = input.name.trim().replace(/\s+/g, " ");
  const errors: SubmissionErrors = {};
  if (!cleaned) errors.name = "Name cannot be empty.";
  else if (cleaned.length > 80) errors.name = "Name too long.";
  const section = sectionForRole(input.role);
  if (!section) errors.role = "Select a valid position from the list.";
  if (input.photoDataUrl) {
    if (!input.photoDataUrl.startsWith("data:image/jpeg;base64,")) {
      errors.photo = "Photo must be a square JPG — use the cropper.";
    } else if (input.photoDataUrl.length > MAX_PHOTO_DATAURL_CHARS) {
      errors.photo = "Photo too large after processing. Retry.";
    }
  }
  if (input.originalDataUrl != null && input.originalDataUrl !== "") {
    if (!input.originalDataUrl.startsWith("data:image/jpeg;base64,")) {
      errors.photo = "Original photo must be a JPG — re-upload.";
    } else if (input.originalDataUrl.length > MAX_ORIGINAL_DATAURL_CHARS) {
      errors.photo = "Original photo too large. Re-upload.";
    }
  }
  Object.assign(
    errors,
    validateLinks({ linkedin: input.linkedin, github: input.github, email: input.email }),
  );
  if (Object.keys(errors).length > 0) throw new TeamSubmissionError(errors);
  const name = rosterMember(cleaned)?.name ?? cleaned;
  return withWriteLock(async () => {
    const store = await readStore();
    // Rename: retire every record under the old name so the old profile
    // stops overriding the roster (no ghost duplicates on /team).
    if (input.previousName && norm(input.previousName) !== norm(name)) {
      store.submissions = store.submissions.filter((s) => norm(s.name) !== norm(input.previousName as string));
    }
    const existing = store.submissions
      .filter((s) => norm(s.name) === norm(name))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
    if (existing) {
      existing.role = input.role;
      existing.section = section as TeamSectionKey;
      if (input.photoDataUrl) existing.photoDataUrl = input.photoDataUrl;
      if (input.originalDataUrl !== undefined) existing.originalDataUrl = input.originalDataUrl;
      existing.linkedin = normalizeUrl(input.linkedin);
      existing.github = normalizeUrl(input.github);
      existing.email = normalizeEmail(input.email);
      existing.status = "approved";
      existing.reviewedAt = new Date().toISOString();
      await writeStore(store);
      return { ...existing };
    }
    const sub: TeamSubmission = {
      id: randomUUID(),
      name,
      role: input.role,
      section: section as TeamSectionKey,
      photoDataUrl: input.photoDataUrl ?? "",
      originalDataUrl: input.originalDataUrl ?? null,
      linkedin: normalizeUrl(input.linkedin),
      github: normalizeUrl(input.github),
      email: normalizeEmail(input.email),
      status: "approved",
      createdAt: new Date().toISOString(),
      reviewedAt: new Date().toISOString(),
    };
    store.submissions.unshift(sub);
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
    linkedin: s.linkedin ?? undefined,
    github: s.github ?? undefined,
    email: s.email ?? undefined,
  };
}

/**
 * Static team.ts lists merged with admin-approved submissions.
 * Name match (case-insensitive) overrides static photo + role + links; otherwise appended to its section.
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
      // Empty photoDataUrl = "no photo change" (static-only member edited
      // without a fresh crop) — never blank the live/static photo.
      if (s.photoDataUrl) existing.photo = s.photoDataUrl;
      existing.role = s.role;
      if (s.linkedin) existing.linkedin = s.linkedin;
      if (s.github) existing.github = s.github;
      if (s.email) existing.email = s.email;
      continue;
    }
    bySection[s.section]?.push(toMember(s));
  }
  return { teamLeads: leads, domainLeads: domain, opsTeam: ops, coordinators: coords };
}

/**
 * Live profile for one member: static roster merged with approved submissions,
 * plus whether they already have a pending request (resubmit updates it).
 */
export async function getMemberProfile(name: string): Promise<{ member: TeamMember | null; hasPending: boolean }> {
  const norm = (v: string) => v.trim().toLowerCase();
  const lists = await getTeamLists();
  const all = [...lists.teamLeads, ...lists.domainLeads, ...lists.opsTeam, ...lists.coordinators];
  const member = all.find((m) => norm(m.name) === norm(name)) ?? rosterMember(name);
  const store = await readStore();
  const hasPending = store.submissions.some((s) => s.status === "pending" && norm(s.name) === norm(name));
  return { member: member ? { ...member } : null, hasPending };
}
