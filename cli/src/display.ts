/**
 * Display formatting utilities for ShadowSniper CLI.
 *
 * @module
 */

import { type GameState, type Bet, RoundStatus, utils } from '@shadow-sniper/api';
const { formatDuration, timeRemaining } = utils;

/**
 * Format a Uint8Array as a short hex string (first 8 chars).
 */
export function shortHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex').slice(0, 8) + '...';
}

/**
 * Format a Uint8Array as a full hex string.
 */
export function fullHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}

/**
 * Format a token amount for display (basic integer display for now).
 */
export function formatAmount(amount: bigint): string {
  return amount.toString();
}

/**
 * Get a colored status label for the round state.
 */
export function statusLabel(status: RoundStatus): string {
  switch (status) {
    case RoundStatus.Resolved:
      return 'RESOLVED';
    case RoundStatus.Open:
      return 'OPEN';
    case RoundStatus.WaitingToResolve:
      return 'WAITING TO RESOLVE';
    case RoundStatus.Expired:
      return 'EXPIRED (cancellable)';
  }
}

/**
 * Display the full game status.
 */
export function displayStatus(state: GameState): string {
  const lines: string[] = [];

  lines.push('=== ShadowSniper Status ===');
  lines.push('');

  // Round info
  lines.push(`Round #${state.roundNumber}`);
  lines.push(`Status: ${statusLabel(state.roundStatus)}`);

  if (state.roundStatus === RoundStatus.Open) {
    const remaining = timeRemaining(state.roundEndTime);
    lines.push(`Time remaining: ${formatDuration(remaining)}`);
  } else if (state.roundStatus === RoundStatus.WaitingToResolve) {
    const deadlineRemaining = timeRemaining(state.roundDeadline);
    lines.push(`Resolve deadline: ${formatDuration(deadlineRemaining)}`);
  }

  lines.push('');

  // Pot info
  lines.push(`Players: ${state.playerCount}/10`);
  lines.push(`Total pot: ${formatAmount(state.totalPot)} tDUST`);
  lines.push(`Progressive pool: ${formatAmount(state.progressivePool)} tDUST`);
  lines.push(`House balance: ${formatAmount(state.houseBalance)} tDUST`);

  // Active bets
  const activeBets = state.bets.filter((b: Bet) => b.active);
  if (activeBets.length > 0) {
    lines.push('');
    lines.push('--- Active Bets ---');
    for (const bet of activeBets) {
      const pct = state.totalPot > 0n
        ? ((bet.amount * 100n) / state.totalPot).toString() + '%'
        : '0%';
      lines.push(`  ${shortHex(bet.player)}: ${formatAmount(bet.amount)} tDUST (${pct})`);
    }
  }

  // Last round results
  const zeroBytes = new Uint8Array(32);
  const hasLastWinner = !state.lastResult.winner.every((b, i) => b === zeroBytes[i]);
  if (hasLastWinner) {
    lines.push('');
    lines.push('--- Last Round ---');
    lines.push(`  Winner: ${shortHex(state.lastResult.winner)}`);
    lines.push(`  Payout: ${formatAmount(state.lastResult.payout)} tDUST`);

    const hasJackpotWinner = !state.lastResult.jackpotWinner.every((b, i) => b === zeroBytes[i]);
    if (hasJackpotWinner) {
      lines.push(`  JACKPOT WINNER: ${shortHex(state.lastResult.jackpotWinner)}`);
      lines.push(`  Jackpot amount: ${formatAmount(state.lastResult.jackpotAmount)} tDUST`);
    }
  }

  lines.push('');

  // Config summary
  lines.push('--- Config ---');
  lines.push(`  Bet range: ${formatAmount(state.config.minBet)} - ${formatAmount(state.config.maxBet)} tDUST`);
  lines.push(`  Round duration: ${formatDuration(state.config.roundDurationSecs)}`);
  lines.push(`  House fee: ${Number(state.config.houseFeeBps) / 100}%`);
  lines.push(`  Progressive: ${Number(state.config.progressiveBps) / 100}%`);
  lines.push(`  Jackpot trigger: 1 in ${state.config.progressiveTrigger}`);
  lines.push(`  Total rounds played: ${state.totalRoundsPlayed}`);

  return lines.join('\n');
}
