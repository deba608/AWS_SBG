import Container from "@/components/Container";

export default function Loading() {
  return (
    <Container className="py-24" aria-busy="true" aria-label="Loading page">
      <div className="mb-8 space-y-3" aria-hidden>
        <div className="mx-auto h-3 w-40 animate-pulse rounded-full bg-line" />
        <div className="mx-auto h-7 w-64 animate-pulse rounded-lg bg-line" />
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            aria-hidden
            className="overflow-hidden rounded-2xl border border-line bg-surface"
          >
            <div className="h-24 animate-pulse border-b border-line bg-coal" />
            <div className="space-y-3 p-6">
              <div className="h-5 w-3/4 animate-pulse rounded bg-line" />
              <div className="h-3 w-full animate-pulse rounded bg-line" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-line" />
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
