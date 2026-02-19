import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  formatDuration,
  timeRemaining,
  isRoundExpired,
  isResolveDeadlineExpired,
  nowSecs,
  computeRoundEndTime,
} from './time.js';

describe('formatDuration', () => {
  it('should format 0 seconds', () => {
    expect(formatDuration(0n)).toBe('0s');
  });

  it('should format seconds only', () => {
    expect(formatDuration(45n)).toBe('45s');
  });

  it('should format minutes and seconds', () => {
    expect(formatDuration(125n)).toBe('2m 5s');
  });

  it('should format exact minutes', () => {
    expect(formatDuration(300n)).toBe('5m');
  });

  it('should format hours and minutes', () => {
    expect(formatDuration(3720n)).toBe('1h 2m');
  });

  it('should format exact hours', () => {
    expect(formatDuration(7200n)).toBe('2h');
  });

  it('should handle number input', () => {
    expect(formatDuration(90)).toBe('1m 30s');
  });

  it('should handle negative values', () => {
    expect(formatDuration(-5n)).toBe('0s');
  });
});

describe('timeRemaining', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return remaining seconds', () => {
    const futureTime = BigInt(Math.floor(Date.now() / 1000)) + 60n;
    const remaining = timeRemaining(futureTime);
    // Should be roughly 60 seconds (allow for test execution time)
    expect(remaining).toBeGreaterThan(55n);
    expect(remaining).toBeLessThanOrEqual(60n);
  });

  it('should return 0 for past timestamps', () => {
    const pastTime = BigInt(Math.floor(Date.now() / 1000)) - 60n;
    expect(timeRemaining(pastTime)).toBe(0n);
  });
});

describe('isRoundExpired', () => {
  it('should return true for past end times', () => {
    const pastTime = BigInt(Math.floor(Date.now() / 1000)) - 10n;
    expect(isRoundExpired(pastTime)).toBe(true);
  });

  it('should return false for future end times', () => {
    const futureTime = BigInt(Math.floor(Date.now() / 1000)) + 600n;
    expect(isRoundExpired(futureTime)).toBe(false);
  });
});

describe('isResolveDeadlineExpired', () => {
  it('should return true for past deadlines', () => {
    const pastTime = BigInt(Math.floor(Date.now() / 1000)) - 10n;
    expect(isResolveDeadlineExpired(pastTime)).toBe(true);
  });

  it('should return false for future deadlines', () => {
    const futureTime = BigInt(Math.floor(Date.now() / 1000)) + 600n;
    expect(isResolveDeadlineExpired(futureTime)).toBe(false);
  });
});

describe('nowSecs', () => {
  it('should return current unix time in seconds', () => {
    const now = nowSecs();
    const expected = BigInt(Math.floor(Date.now() / 1000));
    expect(now).toBeGreaterThanOrEqual(expected - 1n);
    expect(now).toBeLessThanOrEqual(expected + 1n);
  });
});

describe('computeRoundEndTime', () => {
  it('should return now + duration', () => {
    const endTime = computeRoundEndTime(300n);
    const expected = BigInt(Math.floor(Date.now() / 1000)) + 300n;
    expect(endTime).toBeGreaterThanOrEqual(expected - 1n);
    expect(endTime).toBeLessThanOrEqual(expected + 1n);
  });
});
