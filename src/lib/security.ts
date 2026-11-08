import crypto from "node:crypto";
import { NextResponse } from "next/server";

export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString("base64url");
export const sha256 = (v: string) => crypto.createHash("sha256").update(v).digest("hex");

export function clientIp(req: Request): string {
  // On Netlify (functions run on AWS Lambda) the edge sets this header itself,
  // so clients can't override it. It isn't trusted anywhere else.
  const onNetlify = process.env.NETLIFY === "true" || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
  const netlify = onNetlify ? req.headers.get("x-nf-client-connection-ip") : null;
  if (netlify) return netlify.trim();
  // Otherwise only trust forwarding headers when explicitly running behind a proxy.
  if (process.env.TRUST_PROXY === "true") {
    const fwd = req.headers.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0].trim();
    const real = req.headers.get("x-real-ip");
    if (real) return real.trim();
  }
  return "local";
}

/**
 * CSRF defence for state-changing requests: browsers always send Origin on
 * cross-site POST/PUT/DELETE, so require it to match this host.
 */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return req.headers.get("sec-fetch-site") === "same-origin";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/* ───────── In-memory sliding-window rate limiter (per process) ───────── */

const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
  }
  return true;
}

export const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export const forbidden = () => json({ error: "forbidden" }, 403);
export const tooMany = () => json({ error: "rate_limited" }, 429);

export const isProd = process.env.NODE_ENV === "production";
export const secureCookies = process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === "true" : isProd;
