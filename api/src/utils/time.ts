/**
 * Time utilities for ShadowSniper.
 *
 * @module
 */

/**
 * Format a duration in seconds to a human-readable string.
 *
 * @param seconds - Duration in seconds
 * @returns Formatted string like "5m 30s" or "1h 2m"
 */
export function formatDuration(seconds: bigint | number): string {
  const secs = typeof seconds === 'bigint' ? Number(seconds) : seconds;

  if (secs <= 0) return '0s';
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }

  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Get the time remaining until a target unix timestamp.
 *
 * @param targetTimeSecs - Unix timestamp in seconds
 * @returns Remaining seconds (0 if past)
 */
export function timeRemaining(targetTimeSecs: bigint): bigint {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const remaining = targetTimeSecs - now;
  return remaining > 0n ? remaining : 0n;
}

/**
 * Check if a round's betting period has expired.
 *
 * @param roundEndTime - Unix timestamp when round ends (seconds)
 * @returns true if current time is past round end
 */
export function isRoundExpired(roundEndTime: bigint): boolean {
  const now = BigInt(Math.floor(Date.now() / 1000));
  return now > roundEndTime;
}

/**
 * Check if the resolve deadline has expired.
 *
 * @param roundDeadline - Unix timestamp of resolve deadline (seconds)
 * @returns true if current time is past deadline
 */
export function isResolveDeadlineExpired(roundDeadline: bigint): boolean {
  const now = BigInt(Math.floor(Date.now() / 1000));
  return now > roundDeadline;
}

/**
 * Get the current unix timestamp in seconds.
 */
export function nowSecs(): bigint {
  return BigInt(Math.floor(Date.now() / 1000));
}

/**
 * Compute a round end time from now + duration.
 *
 * @param durationSecs - Round duration in seconds
 * @returns Unix timestamp for round end
 */
export function computeRoundEndTime(durationSecs: bigint): bigint {
  return nowSecs() + durationSecs;
}
