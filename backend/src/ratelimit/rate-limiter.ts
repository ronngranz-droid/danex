export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

export class SlidingWindowRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 40, windowMs: number = 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Periodic cleanup every 5 minutes to prevent memory leak
    setInterval(() => this.cleanup(), 5 * 60 * 1000).unref();
  }

  check(key: string): RateLimitResult {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];

    // Filter out timestamps older than the window
    const windowStart = now - this.windowMs;
    const activeTimestamps = timestamps.filter(t => t > windowStart);

    if (activeTimestamps.length >= this.maxRequests) {
      const oldestActive = activeTimestamps[0];
      const resetMs = Math.max(0, oldestActive + this.windowMs - now);
      return {
        allowed: false,
        remaining: 0,
        resetMs
      };
    }

    activeTimestamps.push(now);
    this.requests.set(key, activeTimestamps);

    return {
      allowed: true,
      remaining: this.maxRequests - activeTimestamps.length,
      resetMs: this.windowMs
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    for (const [key, timestamps] of this.requests.entries()) {
      const active = timestamps.filter(t => t > windowStart);
      if (active.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, active);
      }
    }
  }

  reset(): void {
    this.requests.clear();
  }
}
