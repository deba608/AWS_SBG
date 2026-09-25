import { NextResponse } from "next/server";
import { mailConfigured } from "@/lib/mailer";
import { passExpiry } from "@/lib/pass-token";
import { redisConfigured } from "@/lib/pass-redis";
import { storeWritable } from "@/lib/pass-store";

/** Diagnose a failing host: open /api/health in browser. */
export async function GET() {
  const writable = await storeWritable();
  const redis = redisConfigured();
  return NextResponse.json({
    ok: writable || redis,
    store: writable ? "writable" : "READ-ONLY — passes cannot be saved on this host",
    redis: redis ? "configured" : "not-configured — set UPSTASH_REDIS_REST_URL/TOKEN",
    mail: mailConfigured() ? "configured" : "not-configured",
    expiry: passExpiry().toISOString(),
    now: new Date().toISOString(),
  });
}
