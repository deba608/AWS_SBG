import Container from "./Container";

const services = [
  "EC2",
  "S3",
  "Lambda",
  "DynamoDB",
  "Amplify",
  "Bedrock",
  "API Gateway",
  "Cognito",
  "CloudFront",
  "CloudFormation",
  "SageMaker",
  "CodePipeline",
];

export default function TechMarquee() {
  return (
    <section aria-label="Technologies we work with" className="border-y border-line">
      <Container className="py-4">
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[13px] text-faint">
          {services.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
