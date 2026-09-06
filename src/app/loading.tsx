import Container from "@/components/Container";

export default function Loading() {
  return (
    <Container className="py-24" aria-busy="true" aria-label="Loading page">
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-2xl border border-line bg-surface"
          />
        ))}
      </div>
    </Container>
  );
}
