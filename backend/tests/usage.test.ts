import { describe, it, expect, beforeEach } from 'vitest';
import { UsageTracker } from '../src/usage/tracker';
import { SlidingWindowRateLimiter } from '../src/ratelimit/rate-limiter';

describe('UsageTracker & RateLimiter Test Suite', () => {
  let tracker: UsageTracker;

  beforeEach(() => {
    tracker = new UsageTracker(1_000_000); // 1 Million tokens budget
  });

  it('tracks requests, tokens, and percentage accurately', () => {
    tracker.recordUsage(100, 200);
    tracker.recordUsage(300, 400);

    const stats = tracker.getStats();
    expect(stats.totalRequests).toBe(2);
    expect(stats.totalInputTokens).toBe(400);
    expect(stats.totalOutputTokens).toBe(600);
    expect(stats.totalTokens).toBe(1000);
    expect(stats.remainingTokens).toBe(999000);
    expect(stats.usagePercentage).toBe(0.1);
    expect(stats.warning80Exceeded).toBe(false);
    expect(stats.warning95Exceeded).toBe(false);
  });

  it('triggers 80% and 95% warning alerts', () => {
    // Record 810,000 tokens (81%)
    tracker.recordUsage(400_000, 410_000);
    let stats = tracker.getStats();
    expect(stats.warning80Exceeded).toBe(true);
    expect(stats.warning95Exceeded).toBe(false);
    expect(stats.budgetExhausted).toBe(false);

    // Record another 150,000 tokens (total 960,000 = 96%)
    tracker.recordUsage(50_000, 100_000);
    stats = tracker.getStats();
    expect(stats.warning80Exceeded).toBe(true);
    expect(stats.warning95Exceeded).toBe(true);
    expect(stats.budgetExhausted).toBe(false);
  });

  it('SlidingWindowRateLimiter enforces request limits', () => {
    const limiter = new SlidingWindowRateLimiter(3, 1000); // 3 requests per second
    const ip = '127.0.0.1';

    expect(limiter.check(ip).allowed).toBe(true);
    expect(limiter.check(ip).allowed).toBe(true);
    expect(limiter.check(ip).allowed).toBe(true);
    // 4th request exceeds limit
    const fourth = limiter.check(ip);
    expect(fourth.allowed).toBe(false);
    expect(fourth.remaining).toBe(0);
  });
});
