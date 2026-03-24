import { NextResponse } from "next/server";

// ═══════════════════════════════════════════════════════════════════════════
// FinanceOS — Edge Middleware: Traffic Spike Protection
// Handles: Rate limiting, bot protection, edge caching, geo routing
// Runs on Vercel Edge Network — sub-ms latency, no cold starts
// ═══════════════════════════════════════════════════════════════════════════

// ── In-memory rate limit store (per-edge-region, resets on redeploy) ──
// For production scale: upgrade to Vercel KV or Upstash Redis
const rateLimitStore = new Map();

const RATE_LIMITS = {
  api: { window: 60_000, max: 30 },      // 30 req/min per IP for API routes
  notify: { window: 60_000, max: 10 },    // 10 req/min for notification endpoints
  drip: { window: 60_000, max: 5 },       // 5 req/min for drip pipeline
  page: { window: 10_000, max: 60 },      // 60 req/10s for page loads (generous)
};

function getRateLimitKey(ip, bucket) {
  return `${bucket}:${ip}`;
}

function checkRateLimit(ip, bucket) {
  const config = RATE_LIMITS[bucket] || RATE_LIMITS.page;
  const key = getRateLimitKey(ip, bucket);
  const now = Date.now();

  let entry = rateLimitStore.get(key);
  if (!entry || now - entry.windowStart > config.window) {
    entry = { windowStart: now, count: 0 };
  }

  entry.count++;
  rateLimitStore.set(key, entry);

  // Cleanup: prevent memory leak — evict old entries every 1000 writes
  if (rateLimitStore.size > 10_000) {
    for (const [k, v] of rateLimitStore) {
      if (now - v.windowStart > config.window * 2) rateLimitStore.delete(k);
    }
  }

  return {
    allowed: entry.count <= config.max,
    remaining: Math.max(0, config.max - entry.count),
    resetMs: entry.windowStart + config.window - now,
  };
}

// ── Known bot patterns (block scrapers, allow search engines) ──
const BLOCKED_BOTS = /(?:semrush|ahrefs|mj12bot|dotbot|petalbot|bytespider|gptbot|claudebot|ccbot|anthropic-ai)/i;
const ALLOWED_BOTS = /(?:googlebot|bingbot|slurp|duckduckbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp)/i;

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
             request.headers.get("x-real-ip") ||
             "unknown";
  const ua = request.headers.get("user-agent") || "";

  // ── 1. Bot protection — block known scrapers ──
  if (BLOCKED_BOTS.test(ua) && !ALLOWED_BOTS.test(ua)) {
    return new NextResponse("Access denied", { status: 403 });
  }

  // ── 2. Rate limiting by route type ──
  let bucket = "page";
  if (pathname.startsWith("/api/notify")) bucket = "notify";
  else if (pathname.startsWith("/api/drip")) bucket = "drip";
  else if (pathname.startsWith("/api/")) bucket = "api";

  const limit = checkRateLimit(ip, bucket);

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again shortly.", retryAfter: Math.ceil(limit.resetMs / 1000) },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(limit.resetMs / 1000)),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(limit.resetMs / 1000)),
        }
      }
    );
  }

  // ── 3. Edge caching for static marketing pages ──
  const response = NextResponse.next();

  // Rate limit headers on all responses
  response.headers.set("X-RateLimit-Remaining", String(limit.remaining));

  // Landing page — cache at edge for 60s, stale-while-revalidate for 5min
  if (pathname === "/" || pathname === "") {
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    response.headers.set("CDN-Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  }

  // Static marketing pages — cache for 5min at edge
  if (["/privacy", "/terms", "/compare/", "/use-cases/", "/lp/"].some(p => pathname.startsWith(p))) {
    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    response.headers.set("CDN-Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  }

  // API routes — no cache, but add CORS for same-origin
  if (pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    response.headers.set("X-Content-Type-Options", "nosniff");
  }

  // ── 4. Security: prevent API abuse from external origins ──
  if (pathname.startsWith("/api/") && request.method === "POST") {
    const origin = request.headers.get("origin") || "";
    const allowedOrigins = [
      "https://finance-os.app",
      "https://www.finance-os.app",
      "http://localhost:3000",
      "http://localhost:3001",
    ];
    // Allow Vercel preview deployments
    const isVercelPreview = origin.includes(".vercel.app");

    if (!allowedOrigins.includes(origin) && !isVercelPreview && origin !== "") {
      return NextResponse.json(
        { error: "Forbidden — invalid origin" },
        { status: 403 }
      );
    }
  }

  return response;
}

// Only run middleware on app routes, not static assets
export const config = {
  matcher: [
    "/",
    "/privacy",
    "/terms",
    "/compare/:path*",
    "/use-cases/:path*",
    "/lp/:path*",
    "/api/:path*",
  ],
};
