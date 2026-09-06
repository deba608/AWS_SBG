import { SITE } from "@/lib/constants";

export type EventCategory =
  | "Workshop"
  | "Tech Talk"
  | "Hackathon"
  | "Build Session"
  | "Community Day";

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
] as const;

export type EventFilter = (typeof EVENT_FILTERS)[number];

const FILTER_TO_CATEGORY: Record<Exclude<EventFilter, "All">, EventCategory> =
  {
    Workshops: "Workshop",
    "Tech Talks": "Tech Talk",
    Hackathons: "Hackathon",
    "Build Sessions": "Build Session",
  };

export function filterEvents(events: EventItem[], filter: EventFilter) {
  if (filter === "All") return events;
  return events.filter((e) => e.category === FILTER_TO_CATEGORY[filter]);
}

export const communityDay: EventItem = {
  id: "aws-student-community-day-suiit-2026",
  title: "AWS Student Community Day SUIIT 2026",
  category: "Community Day",
  date: "3 October 2026",
  time: "9:00 AM – 4:00 PM IST",
  location: "APJ Abdul Kalam Auditorium, SUIIT, Burla",
  description:
    "Flagship meetup: Cloud, AI/GenAI + DevOps with AWS pros, hands-on labs, networking, lunch, swag and certificate. Free for students — 300+ expected.",
  status: "filling-fast",
  registerUrl: SITE.links.eventCommunityDay,
  detailsUrl: "/events/aws-student-community-day-suiit-2026",
};

export const upcomingEvents: EventItem[] = [
  communityDay,
  {
    id: "aws-cloud-fundamentals",
    title: "AWS Cloud Fundamentals",
    category: "Workshop",
    date: "12 September 2026",
    time: "10:00 AM",
    location: "Seminar Hall, [COLLEGE NAME]",
    description:
      "Learn AWS fundamentals, cloud concepts and core AWS services with guided hands-on labs.",
    status: "open",
  },
  {
    id: "s3-lambda-serverless",
    title: "Serverless with S3 + Lambda",
    category: "Build Session",
    date: "26 September 2026",
    time: "2:00 PM",
    location: "CS Lab 3 + Discord",
    description:
      "Build and deploy an image-resizing pipeline triggered by S3 events. Bring your laptop.",
    status: "open",
  },
  {
    id: "alumni-sa-talk",
    title: "How I Cleared the SAA-C03 — Alumni Talk",
    category: "Tech Talk",
    date: "10 October 2026",
    time: "5:00 PM",
    location: "Seminar Hall, [COLLEGE NAME]",
    description:
      "Exam strategy, preparation resources and Q&A with a recently certified cloud engineer.",
    status: "filling-fast",
  },
  {
    id: "serverless-showdown",
    title: "Serverless Showdown (24-hr Hackathon)",
    category: "Hackathon",
    date: "8 – 9 November 2026",
    time: "9:00 AM onwards",
    location: "Hacker Lab, [COLLEGE NAME]",
    description:
      "Teams of four solve a real-world problem using serverless AWS services. Demos on day two.",
    status: "filling-fast",
  },
  {
    id: "dynamodb-modeling",
    title: "DynamoDB Data Modeling Jam",
    category: "Workshop",
    date: "21 November 2026",
    time: "3:00 PM",
    location: "Online via Discord",
    description:
      "Single-table design patterns and access-pattern modeling with a hands-on lab.",
    status: "open",
  },
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
