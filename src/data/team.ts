export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  lead?: boolean;
  linkedin?: string;
}

export const teamLeads: TeamMember[] = [
  {
    id: "community-lead",
    name: "[COMMUNITY LEAD]",
    role: "Community Lead",
    bio: "Sets the vision, runs meetups and keeps the builder community thriving.",
    lead: true,
    linkedin: "https://linkedin.com",
  },
  {
    id: "technical-lead",
    name: "[TECHNICAL LEAD]",
    role: "Technical Lead",
    bio: "Designs workshop curricula, reviews projects and mentors new builders.",
    lead: true,
    linkedin: "https://linkedin.com",
  },
  {
    id: "events-lead",
    name: "[EVENTS LEAD]",
    role: "Events Lead",
    bio: "Plans workshops, hackathons and speaker sessions end to end.",
    lead: true,
    linkedin: "https://linkedin.com",
  },
  {
    id: "design-lead",
    name: "[DESIGN LEAD]",
    role: "Design Lead",
    bio: "Owns the visual identity, event creatives and the website experience.",
    lead: true,
    linkedin: "https://linkedin.com",
  },
];

export const coreTeam: TeamMember[] = [
  {
    id: "member-1",
    name: "[MEMBER NAME]",
    role: "Workshops",
    bio: "Hosts hands-on labs and learning sessions.",
    linkedin: "https://linkedin.com",
  },
  {
    id: "member-2",
    name: "[MEMBER NAME]",
    role: "Projects",
    bio: "Maintains community repos and reviews builds.",
    linkedin: "https://linkedin.com",
  },
  {
    id: "member-3",
    name: "[MEMBER NAME]",
    role: "Content",
    bio: "Writes recaps, guides and social posts.",
    linkedin: "https://linkedin.com",
  },
  {
    id: "member-4",
    name: "[MEMBER NAME]",
    role: "Outreach",
    bio: "Brings in speakers and partner communities.",
    linkedin: "https://linkedin.com",
  },
  {
    id: "member-5",
    name: "[MEMBER NAME]",
    role: "Design",
    bio: "Ships posters, decks and web UI.",
    linkedin: "https://linkedin.com",
  },
  {
    id: "member-6",
    name: "[MEMBER NAME]",
    role: "Operations",
    bio: "Keeps events, venues and checklists on track.",
    linkedin: "https://linkedin.com",
  },
];
