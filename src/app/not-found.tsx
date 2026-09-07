import Button from "@/components/Button";
import Container from "@/components/Container";

export default function NotFound() {
  return (
    <Container className="py-16 sm:py-20 md:py-32">
      <div className="max-w-xl">
        <h1 className="text-3xl font-bold tracking-tight text-cream md:text-4xl">
          This page doesn&apos;t exist.
        </h1>
        <p className="mt-3 text-base leading-relaxed text-fog">
          The address may have a typo, or the page was moved or deleted. Head
          back home or browse upcoming events to keep going.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row [&>*]:w-full sm:[&>*]:w-auto">
          <Button href="/">Home</Button>
          <Button href="/events" variant="secondary">
            Events
          </Button>
        </div>
      </div>
    </Container>
  );
}
