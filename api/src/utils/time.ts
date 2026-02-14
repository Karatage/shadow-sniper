/**
 * Time utilities for round management
 */

/**
 * Convert milliseconds to a human-readable duration string
 */
export function formatDuration(ms: bigint): string {
  const seconds = Number(ms) / 1000;
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${Math.floor(seconds % 60)}s`;
  }
  return `${Math.floor(seconds)}s`;
}

/**
 * Calculate time remaining until a deadline
 */
export function getTimeRemaining(deadline: bigint, currentTime?: bigint): bigint {
  const now = currentTime ?? BigInt(Date.now());
  const remaining = deadline - now;
  return remaining > 0n ? remaining : 0n;
}

/**
 * Check if a round is currently open for betting
 */
export function isRoundOpen(startTime: bigint, endTime: bigint, currentTime?: bigint): boolean {
  const now = currentTime ?? BigInt(Date.now());
  return now >= startTime && now < endTime;
}

/**
 * Check if a round is ready to be resolved
 */
export function isReadyToResolve(endTime: bigint, currentTime?: bigint): boolean {
  const now = currentTime ?? BigInt(Date.now());
  return now >= endTime;
}

/**
 * Check if a round has passed its resolve deadline
 */
export function hasPassedDeadline(resolveDeadline: bigint, currentTime?: bigint): boolean {
  const now = currentTime ?? BigInt(Date.now());
  return now > resolveDeadline;
}

/**
 * Format a timestamp to ISO string
 */
export function formatTimestamp(timestamp: bigint): string {
  return new Date(Number(timestamp)).toISOString();
}

/**
 * Get current time in milliseconds as bigint
 */
export function now(): bigint {
  return BigInt(Date.now());
}

/**
 * Default round duration: 5 minutes
 */
export const DEFAULT_ROUND_DURATION = 300_000n;

/**
 * Default resolve deadline: 5 minutes after round ends
 */
export const DEFAULT_RESOLVE_DEADLINE = 300_000n;
