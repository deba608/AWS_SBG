export const SITE = {
  name: "AWS Student Builder Group",
  shortName: "AWS SBG",
  collegeName: "Sambalpur University Institute of Information Technology",
  tagline: "Learn → Build → Deploy → Connect",
  description:
    "A student-led community where builders come together to explore cloud computing, AWS, AI, DevOps and modern technologies through hands-on learning and real-world projects.",
  links: {
    join: "https://discord.gg",
    github: "https://github.com",
    linkedin: "https://linkedin.com",
    discord: "https://discord.gg",
    whatsapp: "https://chat.whatsapp.com",
    instagram: "https://www.instagram.com/awssbg_suiit",
    eventDefault: "https://meetup.com",
    eventCommunityDay:
      "https://meetu.ps/e/Qgc6f/1fcHtj/i?utm_source=sbg-site&utm_medium=event-page&utm_campaign=scd-2026",
  },
  communityLead: "[COMMUNITY LEAD]",
  technicalLead: "[TECHNICAL LEAD]",
} as const;

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/#about" },
  { label: "Events", href: "/events" },
  { label: "Team", href: "/team" },
] as const;

export const STATS = [
  { value: 500, suffix: "+", label: "Students" },
  { value: 20, suffix: "+", label: "Workshops" },
  { value: 15, suffix: "+", label: "Projects" },
  { value: 10, suffix: "+", label: "Speakers" },
] as const;

export const SOCIALS = [
  { label: "GitHub", href: SITE.links.github, icon: "Github" },
  { label: "LinkedIn", href: SITE.links.linkedin, icon: "Linkedin" },
  { label: "Instagram", href: SITE.links.instagram, icon: "Instagram" },
  { label: "Discord", href: SITE.links.discord, icon: "MessageCircle" },
] as const;
