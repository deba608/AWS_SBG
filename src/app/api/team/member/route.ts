import { NextResponse } from "next/server";
import { getMemberProfile } from "@/lib/team-store";
import { clientIp, rateOk } from "@/lib/rate-limit";

/** Public: live profile for one roster member so /team/update can show current photo + links. */
export async function GET(req: Request) {
  if (!rateOk(`team-member:${clientIp(req)}`, 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Wait a minute." }, { status: 429 });
  }
  const name = new URL(req.url).searchParams.get("name")?.trim() ?? "";
  if (!name) return NextResponse.json({ error: "name required." }, { status: 400 });
  const { member, hasPending } = await getMemberProfile(name);
  if (!member) return NextResponse.json({ error: "Member not found." }, { status: 404 });
  // Never leak more than the public /team page already shows.
  return NextResponse.json({
    member: {
      name: member.name,
      role: member.role,
      photo: member.photo ?? null,
      linkedin: member.linkedin ?? null,
      github: member.github ?? null,
      email: member.email ?? null,
    },
    hasPending,
  });
}
