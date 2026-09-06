import Container from "@/components/Container";

export default function Loading() {
  return (
    <Container className="py-24" aria-busy="true" aria-label="Loading page">
      <p className="sr-only" role="status">
        Loading page content.
      </p>
      <div className="max-w-md space-y-3" aria-hidden>
        <div className="h-5 w-2/3 animate-pulse rounded bg-line motion-reduce:animate-none" />
        <div className="h-4 w-full animate-pulse rounded bg-line motion-reduce:animate-none" />
      </div>
      <ul className="mt-10 border-t border-line" aria-hidden>
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex gap-4 border-b border-line py-6">
            <div className="h-12 w-12 shrink-0 animate-pulse rounded bg-line motion-reduce:animate-none" />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-5 w-3/4 animate-pulse rounded bg-line motion-reduce:animate-none" />
              <div className="h-3 w-full animate-pulse rounded bg-line motion-reduce:animate-none" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-line motion-reduce:animate-none" />
            </div>
          </li>
        ))}
      </ul>
    </Container>
  );
}
