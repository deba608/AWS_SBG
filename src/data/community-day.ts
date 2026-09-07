export const COMMUNITY_DAY_SLUG = "aws-student-community-day-suiit-2026";

export const COMMUNITY_DAY_META = {
  title: "AWS Student Community Day SUIIT 2026",
  date: "3 October 2026",
  shortDate: "Oct 3",
  time: "9:00 AM – 4:00 PM IST",
  venue: "APJ Abdul Kalam Auditorium, SUIIT, Burla",
  venueShort: "APJ Abdul Kalam Auditorium, SUIIT",
  address: "SUIIT, Jyoti Vihar, Burla, Sambalpur, Odisha",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=APJ+Abdul+Kalam+Auditorium+SUIIT+Burla+Sambalpur",
  // 9 AM IST Oct 3 2026
  startIso: "2026-10-03T09:00:00+05:30",
  capacity: 300,
  entry: "FREE",
  host: "AWS SBG at SUIIT · Hosted by Pratik Samal",
} as const;

export interface AgendaItem {
  time: string;
  title: string;
  description: string;
  tag?: string;
}

export const COMMUNITY_DAY_AGENDA: AgendaItem[] = [
  {
    time: "09:00 AM",
    title: "Check-in + Networking",
    description: "Collect your badge, meet fellow builders, grab a seat.",
    tag: "Doors open",
  },
  {
    time: "10:00 AM",
    title: "Opening + Community Keynote",
    description: "Welcome, community roadmap, and what to expect from the day.",
    tag: "Keynote",
  },
  {
    time: "11:00 AM",
    title: "Cloud Computing on AWS",
    description: "Core concepts + real-world use cases. Speaker TBA.",
    tag: "Cloud · TBA",
  },
  {
    time: "12:00 PM",
    title: "AI + Generative AI with AWS",
    description: "Demos with Bedrock and foundation models. Speaker TBA.",
    tag: "AI/GenAI · TBA",
  },
  {
    time: "01:00 PM",
    title: "Lunch Break",
    description: "Lunch for registered participants. Network over food.",
    tag: "Included",
  },
  {
    time: "02:00 PM",
    title: "DevOps in Practice",
    description: "CI/CD, serverless and shipping fast. Speaker TBA.",
    tag: "DevOps · TBA",
  },
  {
    time: "03:00 PM",
    title: "Hands-on + Interactive Activities",
    description: "Build-along labs, quizzes and community challenges.",
    tag: "Hands-on",
  },
  {
    time: "04:00 PM",
    title: "Swag, Certificates + Close",
    description: "Goodies, participation certificates and group photo.",
    tag: "Closing",
  },
];

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
    title: "Swag + Goodies",
    description: "Exciting event swag for attendees.",
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
    a: "Yes. Entry is FREE. Just RSVP on Meetup so we can plan lunch, swag and seating for 300+ attendees.",
  },
  {
    q: "How do I register?",
    a: "Click Register — it opens Meetup. Sign in, join the AWS SBG group, hit Attend/RSVP, then show your RSVP confirmation at the venue with your college ID.",
  },
  {
    q: "Do I need prior AWS experience?",
    a: "No. Beginners are welcome — sessions start from cloud fundamentals and go up to AI/GenAI and DevOps.",
  },
  {
    q: "Who can attend?",
    a: "Students interested in AWS/Cloud, devs, AI/ML + GenAI enthusiasts, DevOps learners and open-source contributors. Non-SUIIT students: RSVP on Meetup and watch the event page for entry notes.",
  },
  {
    q: "What should I bring?",
    a: "College ID, Meetup RSVP confirmation, and optionally a laptop for hands-on activities. Curiosity required.",
  },
  {
    q: "Is lunch + certificate included?",
    a: "Yes — lunch for registered participants and a participation certificate, per the official Meetup listing.",
  },
  {
    q: "Where is the venue?",
    a: "APJ Abdul Kalam Auditorium, SUIIT, Jyoti Vihar, Burla, Sambalpur. Use the Get directions button on this page.",
  },
] as const;

export const COMMUNITY_DAY_STEPS = [
  {
    title: "Share your details",
    description: "Tap Register — a 30-sec form, then Meetup RSVP (mandatory — the form alone doesn't reserve a seat).",
  },
  {
    title: "Join the group",
    description: "Join the AWS SBG at SUIIT group so you get updates + headcount questions.",
  },
  {
    title: "Show up Oct 3",
    description: "Bring college ID + RSVP confirmation to APJ Abdul Kalam Auditorium by 9 AM.",
  },
] as const;
