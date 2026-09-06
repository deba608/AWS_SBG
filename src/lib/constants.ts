export const SITE = {
  name: "AWS Student Builder Group",
  shortName: "AWS SBG",
  collegeName: "[COLLEGE NAME]",
  tagline: "Learn → Build → Deploy → Connect",
  description:
    "A student-led community where builders come together to explore cloud computing, AWS, AI, DevOps and modern technologies through hands-on learning and real-world projects.",
  links: {
    join: "[DISCORD LINK]",
    github: "[GITHUB LINK]",
    linkedin: "[LINKEDIN LINK]",
    discord: "[DISCORD LINK]",
    whatsapp: "[WHATSAPP LINK]",
    instagram: "[INSTAGRAM LINK]",
    eventDefault: "[EVENT LINK]",
  },
  communityLead: "[COMMUNITY LEAD]",
  technicalLead: "[TECHNICAL LEAD]",
} as const;

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/#about" },
  { label: "Events", href: "/events" },
  { label: "Learning", href: "/learning" },
  { label: "Projects", href: "/projects" },
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
