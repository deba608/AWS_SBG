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
  /** Groups session under a flagship parent (e.g. Community Day). */
  parentId?: string;
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
  time: "9:00 AM – 5:30 PM IST",
  location: "APJ Abdul Kalam Auditorium, SUIIT, Burla",
  description:
    "Flagship 3-day gathering: DecodeX Hackathon, Tech Parliament, Make-A-Bot, Speaker & Podcast session, networking, lunch and certificates. Free for students.",
  status: "filling-fast",
  registerUrl: "/passes",
  detailsUrl: "/events/aws-student-community-day-suiit-2026",
};

export const decodeXHackathon: EventItem = {
  id: "decodex-hackathon-2026",
  parentId: "aws-student-community-day-suiit-2026",
  title: "DecodeX Hackathon (Day 1)",
  category: "Hackathon",
  date: "6 October 2026",
  time: "9:00 AM – 5:30 PM IST",
  location: "APJ Abdul Kalam Auditorium, SUIIT",
  description:
    "Community Day flagship hackathon: Problem statement submission, Phase I & II sprints, mentor guidance, and jury evaluation on AWS.",
  status: "open",
  registerUrl: "/passes",
  detailsUrl: "/events/aws-student-community-day-suiit-2026",
};

export const techparlament: EventItem = {
  id: "techparlament-2026",
  parentId: "aws-student-community-day-suiit-2026",
  title: "Tech Parliament (Day 2)",
  category: "Tech Talk",
  date: "7 October 2026",
  time: "9:30 AM – 10:30 AM IST",
  location: "Seminar Hall, SUIIT",
  description:
    "Parliamentary-style tech debate on architecture trade-offs: Serverless vs Containers, Monoliths vs Microservices, and AI in software engineering.",
  status: "open",
  registerUrl: "/passes",
  detailsUrl: "/events/aws-student-community-day-suiit-2026",
};

export const makeABot: EventItem = {
  id: "make-a-bot-competition",
  parentId: "aws-student-community-day-suiit-2026",
  title: "Make-A-Bot Competition (Day 2)",
  category: "Build Session",
  date: "7 October 2026",
  time: "11:00 AM – 1:00 PM IST",
  location: "Seminar Hall, SUIIT",
  description:
    "Bot-building competition: design, develop and deploy conversational AI bots and autonomous agents using Amazon Bedrock and AWS Lambda. Compete for prizes.",
  status: "open",
  registerUrl: "/passes",
  detailsUrl: "/events/aws-student-community-day-suiit-2026",
};

export const speakerPodcast: EventItem = {
  id: "speaker-podcast-session",
  parentId: "aws-student-community-day-suiit-2026",
  title: "Speaker & Podcast Session (Day 3)",
  category: "Podcast",
  date: "8 October 2026",
  time: "10:00 AM – 12:00 PM IST",
  location: "APJ Abdul Kalam Auditorium, SUIIT",
  description:
    "Keynote fireside chat and live podcast session with AWS professionals and industry leaders, followed by prize distribution and community lunch.",
  status: "open",
  registerUrl: "/passes",
  detailsUrl: "/events/aws-student-community-day-suiit-2026",
};

export const upcomingEvents: EventItem[] = [
  communityDay,
  decodeXHackathon,
  techparlament,
  makeABot,
  speakerPodcast,
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
