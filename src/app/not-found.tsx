import Link from "next/link";
import Button from "@/components/Button";
import Container from "@/components/Container";

export default function NotFound() {
  return (
    <Container className="py-24 text-center md:py-32">
      <p className="font-mono text-sm text-brand">404</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-cream md:text-4xl">
        This route doesn&apos;t exist.
      </h1>
      <p className="mx-auto mt-3 max-w-md text-fog">
        The page you&apos;re looking for was moved, deleted, or never deployed.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button href="/">Back to home</Button>
        <Button href="/events" variant="secondary">
          Browse events
        </Button>
      </div>
      <p className="mt-6 text-xs text-faint">
        Or <Link href="/" className="text-brand hover:text-cream">start from the homepage</Link>.
      </p>
    </Container>
  );
}
