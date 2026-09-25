/** Tiny in-memory throttle. Resets on restart — fine for <500 event. */
const hits = new Map<string, number[]>();

export function rateOk(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    hits.set(key, arr);
    return false;
  }
  arr.push(now);
  hits.set(key, arr);
  // cap memory
  if (hits.size > 2000) {
    const oldest = [...hits.keys()].slice(0, 500);
    for (const k of oldest) hits.delete(k);
  }
  return true;
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local"
  );
}
