export interface LearningPath {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  topics: string[];
  progress: number;
}

export const learningPaths: LearningPath[] = [
  {
    id: "cloud-fundamentals",
    title: "Cloud Fundamentals",
    description:
      "Learn cloud concepts, AWS core services and architecture fundamentals from zero.",
    difficulty: "Beginner → Intermediate",
    level: "Beginner",
    duration: "6 hrs",
    topics: ["Cloud concepts", "EC2", "S3", "IAM basics", "Billing & pricing"],
    progress: 0,
  },
  {
    id: "aws-developer",
    title: "AWS Developer",
    description:
      "Learn how to build, deploy and scale applications on AWS with serverless and containers.",
    difficulty: "Beginner → Intermediate",
    level: "Beginner",
    duration: "10 hrs",
    topics: ["Lambda", "API Gateway", "DynamoDB", "Amplify", "Cognito"],
    progress: 0,
  },
  {
    id: "devops",
    title: "DevOps",
    description:
      "Learn CI/CD, containers, infrastructure as code and deployment workflows.",
    difficulty: "Intermediate",
    level: "Intermediate",
    duration: "12 hrs",
    topics: ["CI/CD", "CodePipeline", "CloudFormation", "CloudWatch", "ECR & ECS"],
    progress: 0,
  },
  {
    id: "cloud-security",
    title: "Cloud Security",
    description:
      "Learn IAM, permissions, security principles and AWS best practices.",
    difficulty: "Intermediate",
    level: "Intermediate",
    duration: "8 hrs",
    topics: ["IAM policies", "KMS", "WAF", "Config", "Shared responsibility"],
    progress: 0,
  },
  {
    id: "ai-ml-on-aws",
    title: "AI / ML on AWS",
    description:
      "Explore AWS services for artificial intelligence and machine learning.",
    difficulty: "Intermediate → Advanced",
    level: "Advanced",
    duration: "10 hrs",
    topics: ["Bedrock", "SageMaker", "RAG", "PartyRock", "Prompt engineering"],
    progress: 0,
  },
];
