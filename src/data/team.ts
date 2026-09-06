export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  lead?: boolean;
  github?: string;
  linkedin?: string;
}

export const teamLeads: TeamMember[] = [
  {
    id: "community-lead",
    name: "[COMMUNITY LEAD]",
    role: "Community Lead",
    bio: "Sets the vision, runs meetups and keeps the builder community thriving.",
    lead: true,
    github: "[GITHUB LINK]",
    linkedin: "[LINKEDIN LINK]",
  },
  {
    id: "technical-lead",
    name: "[TECHNICAL LEAD]",
    role: "Technical Lead",
    bio: "Designs workshop curricula, reviews projects and mentors new builders.",
    lead: true,
    github: "[GITHUB LINK]",
    linkedin: "[LINKEDIN LINK]",
  },
  {
    id: "events-lead",
    name: "[EVENTS LEAD]",
    role: "Events Lead",
    bio: "Plans workshops, hackathons and speaker sessions end to end.",
    lead: true,
    github: "[GITHUB LINK]",
    linkedin: "[LINKEDIN LINK]",
  },
  {
    id: "design-lead",
    name: "[DESIGN LEAD]",
    role: "Design Lead",
    bio: "Owns the visual identity, event creatives and the website experience.",
    lead: true,
    github: "[GITHUB LINK]",
    linkedin: "[LINKEDIN LINK]",
  },
];

export const coreTeam: TeamMember[] = [
  {
    id: "member-1",
    name: "[MEMBER NAME]",
    role: "Workshops",
    bio: "Hosts hands-on labs and learning sessions.",
    github: "[GITHUB LINK]",
    linkedin: "[LINKEDIN LINK]",
  },
  {
    id: "member-2",
    name: "[MEMBER NAME]",
    role: "Projects",
    bio: "Maintains community repos and reviews builds.",
    github: "[GITHUB LINK]",
    linkedin: "[LINKEDIN LINK]",
  },
  {
    id: "member-3",
    name: "[MEMBER NAME]",
    role: "Content",
    bio: "Writes recaps, guides and social posts.",
    github: "[GITHUB LINK]",
    linkedin: "[LINKEDIN LINK]",
  },
  {
    id: "member-4",
    name: "[MEMBER NAME]",
    role: "Outreach",
    bio: "Brings in speakers and partner communities.",
    github: "[GITHUB LINK]",
    linkedin: "[LINKEDIN LINK]",
  },
  {
    id: "member-5",
    name: "[MEMBER NAME]",
    role: "Design",
    bio: "Ships posters, decks and web UI.",
    github: "[GITHUB LINK]",
    linkedin: "[LINKEDIN LINK]",
  },
  {
    id: "member-6",
    name: "[MEMBER NAME]",
    role: "Operations",
    bio: "Keeps events, venues and checklists on track.",
    github: "[GITHUB LINK]",
    linkedin: "[LINKEDIN LINK]",
  },
];
