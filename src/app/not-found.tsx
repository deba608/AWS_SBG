import Link from "next/link";
import Button from "@/components/Button";
import Container from "@/components/Container";

export default function NotFound() {
  return (
    <Container className="relative py-24 text-center md:py-32">
      <div className="bg-grid bg-grid-fade pointer-events-none absolute inset-0" aria-hidden />
      <div className="glow-brand pointer-events-none absolute left-1/2 top-8 h-56 w-[28rem] -translate-x-1/2" aria-hidden />
      <div className="relative">
      <p className="inline-flex items-center rounded-full border border-brand/30 bg-brand/10 px-3 py-1 font-mono text-sm font-semibold text-brand">404</p>
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
        Or <Link href="/" className="min-h-[44px] py-3 text-brand hover:text-cream">start from the homepage</Link>.
      </p>
      </div>
    </Container>
  );
}
