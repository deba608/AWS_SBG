export const COMMUNITY_DAY_SLUG = "aws-student-community-day-suiit-2026";

export const COMMUNITY_DAY_META = {
  title: "AWS Student Community Day SUIIT 2026",
  date: "6–8 October 2026",
  shortDate: "Oct 6–8",
  time: "9:00 AM – 5:30 PM IST",
  venue: "APJ Abdul Kalam Auditorium, SUIIT, Burla",
  venueShort: "APJ Abdul Kalam Auditorium, SUIIT",
  address: "SUIIT, Jyoti Vihar, Burla, Sambalpur, Odisha",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=APJ+Abdul+Kalam+Auditorium+SUIIT+Burla+Sambalpur",
  // 9 AM IST Oct 6 2026
  startIso: "2026-10-06T09:00:00+05:30",
  endIso: "2026-10-08T14:00:00+05:30",
  capacity: 300,
  entry: "FREE",
  host: "AWS SBG at SUIIT · Hosted by Pratik Samal",
} as const;

export interface AgendaItem {
  time: string;
  title: string;
  description: string;
  venue?: string;
  tag?: string;
}

export interface DaySchedule {
  dayNumber: number;
  dayLabel: string;
  date: string;
  shortDate: string;
  theme: string;
  defaultVenue: string;
  schedule: AgendaItem[];
}

export const COMMUNITY_DAY_SCHEDULE: DaySchedule[] = [
  {
    dayNumber: 1,
    dayLabel: "Day 1",
    date: "Tuesday, 06 October 2026",
    shortDate: "Oct 6",
    theme: "DecodeX Hackathon",
    defaultVenue: "APJ Abdul Kalam Auditorium",
    schedule: [
      {
        time: "9:00 – 9:30 AM",
        title: "Participant check-in",
        description: "Badge collection, team verification, and workstation setup.",
        venue: "APJ Abdul Kalam Auditorium",
        tag: "Check-in",
      },
      {
        time: "9:30 – 10:30 AM",
        title: "Problem Statement Submission",
        description: "Hackathon challenge briefing, team submissions, and guideline walkthrough.",
        venue: "APJ Abdul Kalam Auditorium",
        tag: "Kickoff",
      },
      {
        time: "10:30 AM – 1:00 PM",
        title: "Hackathon – Phase I",
        description: "Architecture sprint, rapid prototyping, and mentor guidance rounds.",
        venue: "APJ Abdul Kalam Auditorium",
        tag: "Sprint I",
      },
      {
        time: "1:00 – 2:00 PM",
        title: "Lunch break",
        description: "Lunch provided for all registered participants. Network and recharge.",
        venue: "APJ Abdul Kalam Auditorium",
        tag: "Lunch",
      },
      {
        time: "2:00 – 4:00 PM",
        title: "Hackathon – Phase II",
        description: "Implementation, AWS service integrations, testing, and demo polish.",
        venue: "APJ Abdul Kalam Auditorium",
        tag: "Sprint II",
      },
      {
        time: "4:00 – 5:00 PM",
        title: "Evaluation",
        description: "Jury review, architecture assessment, and project demonstrations.",
        venue: "APJ Abdul Kalam Auditorium",
        tag: "Judging",
      },
      {
        time: "5:00 – 5:30 PM",
        title: "Hackathon Ends",
        description: "Day 1 wrap-up, jury deliberations, and Day 2 announcements.",
        venue: "APJ Abdul Kalam Auditorium",
        tag: "Closing",
      },
    ],
  },
  {
    dayNumber: 2,
    dayLabel: "Day 2",
    date: "Wednesday, 07 October 2026",
    shortDate: "Oct 7",
    theme: "Tech Parliament & Make-A-Bot",
    defaultVenue: "Seminar Hall",
    schedule: [
      {
        time: "9:30 – 10:30 AM",
        title: "Tech Parliament",
        description: "High-energy debate on architecture choices: Serverless vs Containers, Monoliths vs Microservices, and AI trade-offs.",
        venue: "Seminar Hall",
        tag: "Debate",
      },
      {
        time: "11:00 AM – 01:00 PM",
        title: "Make-A-Bot Competition",
        description: "Bot-building competition: design, develop and deploy AI bots using Amazon Bedrock and AWS Lambda. Compete for prizes.",
        venue: "Seminar Hall",
        tag: "Competition",
      },
    ],
  },
  {
    dayNumber: 3,
    dayLabel: "Day 3",
    date: "Thursday, 08 October 2026",
    shortDate: "Oct 8",
    theme: "Speaker Session, Prize Distribution & Lunch",
    defaultVenue: "APJ Abdul Kalam Auditorium",
    schedule: [
      {
        time: "10:00 AM – 12:00 PM",
        title: "Speaker / Podcast Session",
        description: "Fireside chat and live podcast with AWS practitioners on engineering journeys and industry insights.",
        venue: "APJ Abdul Kalam Auditorium",
        tag: "Keynote & Podcast",
      },
      {
        time: "12:00 – 01:00 PM",
        title: "Prize Distribution",
        description: "Felicitation of DecodeX Hackathon winners, top contributors, and certificate distribution.",
        venue: "APJ Abdul Kalam Auditorium",
        tag: "Awards",
      },
      {
        time: "01:00 – 02:00 PM",
        title: "Lunch",
        description: "Grand community lunch and open networking session.",
        venue: "CR 1",
        tag: "Lunch",
      },
    ],
  },
];

export const COMMUNITY_DAY_AGENDA: AgendaItem[] = COMMUNITY_DAY_SCHEDULE.flatMap(
  (day) => day.schedule
);

export interface SpeakerPlaceholder {
  role: string;
  focus: string;
}

export const COMMUNITY_DAY_SPEAKERS: SpeakerPlaceholder[] = [
  { role: "AWS Professional", focus: "Cloud · TBA" },
  { role: "Community Leader", focus: "AI / GenAI · TBA" },
  { role: "Industry Expert", focus: "DevOps · TBA" },
];

export const COMMUNITY_DAY_PERKS = [
  {
    title: "Lunch included",
    description: "Lunch for all registered participants.",
  },
  {
    title: "Certificate",
    description: "Participation certificate for attendees.",
  },
  {
    title: "Networking",
    description: "Meet 300+ students, devs and cloud enthusiasts.",
  },
] as const;

export const COMMUNITY_DAY_FAQS = [
  {
    q: "Is entry really free?",
    a: "Yes. Entry is FREE. Just register on this page to get your QR entry pass — it helps us plan lunch, seating and logistics for 300+ attendees.",
  },
  {
    q: "How do I register?",
    a: "Click Get event pass — fill name, roll number, college mail, gender and food preference. Your QR pass shows instantly and emails to you. Show it at the venue gate.",
  },
  {
    q: "Do I need prior AWS experience?",
    a: "No. Beginners are welcome — sessions start from cloud fundamentals and go up to AI/GenAI and DevOps.",
  },
  {
    q: "Who can attend?",
    a: "Students interested in AWS/Cloud, devs, AI/ML + GenAI enthusiasts, DevOps learners and open-source contributors. Non-SUIIT students: register here for a pass and watch the event page for entry notes.",
  },
  {
    q: "What should I bring?",
    a: "Your entry pass (required at entry). Curiosity required — no prior AWS experience needed.",
  },
  {
    q: "Is lunch + certificate included?",
    a: "Yes — lunch for pass holders and a participation certificate.",
  },
  {
    q: "Where is the venue?",
    a: "APJ Abdul Kalam Auditorium, SUIIT, Jyoti Vihar, Burla, Sambalpur. Use the Get directions button on this page.",
  },
] as const;

export const COMMUNITY_DAY_STEPS = [
  {
    title: "Get your pass",
    description: "Tap Get event pass — a 30-sec form, QR generates instantly + emails to you.",
  },
  {
    title: "Join the group",
    description: "Join the AWS SBG at SUIIT group so you get updates + headcount questions.",
  },
  {
    title: "Show up Oct 6–8",
    description: "Bring your entry pass to APJ Abdul Kalam Auditorium by 9 AM.",
  },
] as const;
