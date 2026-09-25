import { SITE } from "@/lib/constants";

export type EventCategory =
  | "Workshop"
  | "Tech Talk"
  | "Hackathon"
  | "Build Session"
  | "Community Day"
  | "Podcast";

export type EventStatus = "open" | "filling-fast" | "closed";

export interface EventItem {
  id: string;
  title: string;
  category: EventCategory;
  date: string;
  time: string;
  location: string;
  description: string;
  status: EventStatus;
  registerUrl?: string;
  detailsUrl?: string;
}

export const EVENT_FILTERS = [
  "All",
  "Workshops",
  "Tech Talks",
  "Hackathons",
  "Build Sessions",
  "Podcasts",
] as const;

export type EventFilter = (typeof EVENT_FILTERS)[number];

const FILTER_TO_CATEGORY: Record<Exclude<EventFilter, "All">, EventCategory> =
  {
    Workshops: "Workshop",
    "Tech Talks": "Tech Talk",
    Hackathons: "Hackathon",
    "Build Sessions": "Build Session",
    Podcasts: "Podcast",
  };

export function filterEvents(events: EventItem[], filter: EventFilter) {
  if (filter === "All") return events;
  return events.filter((e) => e.category === FILTER_TO_CATEGORY[filter]);
}

export const communityDay: EventItem = {
  id: "aws-student-community-day-suiit-2026",
  title: "AWS Student Community Day SUIIT 2026",
  category: "Community Day",
  date: "6–8 October 2026",
  time: "9:00 AM – 4:00 PM IST",
  location: "APJ Abdul Kalam Auditorium, SUIIT, Burla",
  description:
    "Flagship meetup: Cloud, AI/GenAI + DevOps with AWS pros, hands-on labs, networking, lunch and certificate. Free for students — 300+ expected.",
  status: "filling-fast",
  registerUrl: SITE.links.eventCommunityDay,
  detailsUrl: "/events/aws-student-community-day-suiit-2026",
};

export const buildABot: EventItem = {
  id: "build-a-bot-ai-agents",
  title: "Build a Bot: AI Agents on AWS",
  category: "Build Session",
  date: "10 October 2026",
  time: "2:00 PM – 5:00 PM IST",
  location: "CS Lab 2, SUIIT, Burla",
  description:
    "Hands-on build session: create conversational AI bots and autonomous agents using Amazon Bedrock, AWS Lambda, and Python. Build and deploy in 3 hours.",
  status: "open",
  registerUrl: SITE.links.eventDefault,
};

export const techparlament: EventItem = {
  id: "techparlament-2026",
  title: "Techparlament: The Great Cloud & AI Debate",
  category: "Tech Talk",
  date: "17 October 2026",
  time: "4:00 PM – 6:30 PM IST",
  location: "Seminar Hall, SUIIT / Live Stream",
  description:
    "Parliamentary-style tech debate and panel series on architecture trade-offs: Serverless vs Containers, Monoliths vs Microservices, and AI ethics in software engineering.",
  status: "open",
  registerUrl: SITE.links.eventDefault,
};

export const speakerPodcast: EventItem = {
  id: "speaker-podcast-session",
  title: "Behind the Cloud: Speaker & Live Podcast Session",
  category: "Podcast",
  date: "24 October 2026",
  time: "5:00 PM – 6:30 PM IST",
  location: "SUIIT Media Hub & YouTube Live",
  description:
    "Interactive live podcast and fireside chat with guest cloud architects and founders discussing real-world scale, career milestones, failure stories, and live audience Q&A.",
  status: "open",
  registerUrl: SITE.links.eventDefault,
};

export const decodeXHackathon: EventItem = {
  id: "decodex-hackathon-2026",
  title: "DecodeX Hackathon 2026",
  category: "Hackathon",
  date: "14 – 15 November 2026",
  time: "24 Hours · Starts 10:00 AM IST",
  location: "Innovation Center, SUIIT & Online",
  description:
    "Flagship 24-hour hackathon bringing student teams together to decode complex problems and build impactful Cloud & Generative AI solutions with AWS mentorship and cash prizes.",
  status: "open",
  registerUrl: SITE.links.eventDefault,
};

export const upcomingEvents: EventItem[] = [
  communityDay,
  buildABot,
  techparlament,
  speakerPodcast,
  decodeXHackathon,
];

export interface PastEvent {
  id: string;
  title: string;
  date: string;
  summary: string;
}

export const pastEvents: PastEvent[] = [
  {
    id: "git-amplify-deploys",
    title: "Git + Amplify Deploys",
    date: "August 2026",
    summary:
      "60 attendees shipped 20 static sites to AWS Amplify with Git-based CI/CD.",
  },
  {
    id: "cloud-resume-kickoff",
    title: "Cloud Resume Challenge Kickoff",
    date: "July 2026",
    summary:
      "Students launched resume sites on S3 + CloudFront and wired visitor counters with Lambda.",
  },
  {
    id: "bedrock-playground",
    title: "Bedrock AI Playground",
    date: "June 2026",
    summary:
      "Live demos of foundation models and RAG with Bedrock Knowledge Bases.",
  },
];
