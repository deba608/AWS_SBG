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
  const row = [...services, ...services];
  return (
    <div aria-hidden className="overflow-hidden border-y border-line bg-coal/60 py-4">
      <div className="animate-marquee marquee-mask flex w-max items-center gap-8 pr-8">
        {row.map((s, i) => (
          <span key={i} className="flex items-center gap-8 font-mono text-sm text-faint">
            {s}
            <span className="text-brand">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
