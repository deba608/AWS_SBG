export interface Project {
  id: string;
  title: string;
  description: string;
  tech: string[];
  aws: string[];
  githubUrl: string;
  demoUrl: string;
}

export const projects: Project[] = [
  {
    id: "campusconnect",
    title: "CampusConnect",
    description:
      "A student collaboration platform for events, clubs and project teams at [COLLEGE NAME].",
    tech: ["React", "Node.js", "AWS"],
    aws: ["Lambda", "DynamoDB", "S3"],
    githubUrl: "[GITHUB LINK]",
    demoUrl: "[EVENT LINK]",
  },
  {
    id: "noteshare-serverless",
    title: "NoteShare Serverless",
    description:
      "Markdown notes app with realtime sync and serverless authentication.",
    tech: ["Next.js", "TypeScript", "Tailwind"],
    aws: ["Lambda", "DynamoDB", "Cognito"],
    githubUrl: "[GITHUB LINK]",
    demoUrl: "[EVENT LINK]",
  },
  {
    id: "attendance-tracker",
    title: "Attendance Tracker",
    description:
      "QR-based attendance system for workshops with an organizer dashboard.",
    tech: ["React", "Amplify", "GraphQL"],
    aws: ["Amplify", "Cognito", "AppSync"],
    githubUrl: "[GITHUB LINK]",
    demoUrl: "[EVENT LINK]",
  },
  {
    id: "cloud-resume-gallery",
    title: "Cloud Resume Gallery",
    description:
      "A gallery of student resumes deployed the serverless way — open for contributions.",
    tech: ["HTML", "JavaScript", "S3"],
    aws: ["S3", "CloudFront", "Route 53"],
    githubUrl: "[GITHUB LINK]",
    demoUrl: "[EVENT LINK]",
  },
];
