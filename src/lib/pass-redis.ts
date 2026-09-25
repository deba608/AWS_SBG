import { Redis } from "@upstash/redis";

let client: Redis | null | undefined;

/** Singleton; null when env missing (local dev uses file store). */
export function getRedis(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    client = null;
    return client;
  }
  client = new Redis({ url, token });
  return client;
}

export function redisConfigured(): boolean {
  return getRedis() !== null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Distributed mutex via SET NX EX. Serializes read-modify-write across
 * serverless instances. Lock auto-expires in 30s if a holder crashes.
 */
export async function withRedisLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const redis = getRedis();
  if (!redis) return fn();
  const token = `${process.pid}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  for (let i = 0; i < 200; i++) {
    const ok = await redis.set(key, token, { nx: true, ex: 30 });
    if (ok === "OK") break;
    if (i === 199) throw new Error("Store busy. Retry.");
    await sleep(50);
  }
  try {
    return await fn();
  } finally {
    try {
      const cur = await redis.get<string>(key);
      if (cur === token) await redis.del(key);
    } catch {
      // lock expires on its own; store write already done
    }
  }
}
