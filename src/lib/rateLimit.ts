import { NextResponse } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateLimitRecord>();

// Clean up memory to prevent leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimits.forEach((record, ip) => {
      if (now > record.resetAt) rateLimits.delete(ip);
    });
  }, 60000).unref();
}

export function applyRateLimit(request: Request, limit = 5, windowMs = 10 * 60 * 1000) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  
  const now = Date.now();
  const record = rateLimits.get(ip);

  if (!record || now > record.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (record.count >= limit) {
    return NextResponse.json(
      { success: false, error: "Rate limit reached. Please wait before generating another report." },
      { status: 429 }
    );
  }

  record.count++;
  return null;
}
