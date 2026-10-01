import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { hackathonCount, hackathonLunchCounts, listHackathonTeams } from "@/lib/hackathon-store";
import { passStats, registrationCount } from "@/lib/pass-store";
import { MAKE_A_BOT_FORM_URL, TECH_PARLIAMENT_FORM_URL } from "@/data/events";

/** Admin-only combined snapshot: Day 1 hackathon, Day 2 contests, Day 3 Community Day. */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const [hCount, hLunch, hTeams, pCount, pStats] = await Promise.all([
    hackathonCount(),
    hackathonLunchCounts(),
    listHackathonTeams(),
    registrationCount(),
    passStats(),
  ]);
  const members = hTeams.teams.reduce((n, t) => n + 1 + t.members.length, 0);
  return NextResponse.json({
    day1: {
      label: "Day 1 · 6 Oct · DecodeX Hackathon",
      teams: hCount.registered,
      teamLimit: hCount.limit,
      teamsOpen: hCount.open,
      members,
      lunchVeg: hLunch.veg,
      lunchNonveg: hLunch.nonveg,
      href: "/admin/hackathon",
    },
    day2: {
      label: "Day 2 · 7 Oct · Tech Parliament + Make-A-Bot",
      note: "Tracked in Google Forms (no on-site count)",
      forms: [
        { label: "Tech Parliament", url: TECH_PARLIAMENT_FORM_URL },
        { label: "Make-A-Bot", url: MAKE_A_BOT_FORM_URL },
      ],
    },
    day3: {
      label: "Day 3 · 8 Oct · Student Community Day",
      registered: pCount.registered,
      limit: pCount.limit,
      open: pCount.open,
      perYear: pCount.perYear,
      lunchVeg: pStats.veg,
      lunchNonveg: pStats.nonveg,
      href: "/passes",
    },
  });
}
