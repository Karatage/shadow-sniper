/**
 * RNG utilities for ShadowSniper.
 * Secret generation, commitment creation, seed derivation, and winner selection.
 *
 * Uses the contract's pureCircuits for hash compatibility.
 *
 * @module
 */

import { randomBytes as nodeRandomBytes } from 'node:crypto';

/**
 * Generate a cryptographically secure random 32-byte secret.
 */
export function generateSecret(): Uint8Array {
  return nodeRandomBytes(32);
}

/**
 * Create a commitment from a secret and round number.
 * Uses persistentHash(secret, roundNumber) to match the on-chain circuit.
 *
 * @param pureCircuits - The contract's pure circuits (for hash compatibility)
 * @param secret - 32-byte random secret
 * @param roundNumber - Current round number
 * @returns 32-byte commitment hash
 */
export function createCommitment(
  pureCircuits: { makeCommitment: (secret: Uint8Array, rn: Uint8Array) => Uint8Array },
  secret: Uint8Array,
  roundNumber: bigint,
): Uint8Array {
  const rnBytes = bigintToBytes32(roundNumber);
  return pureCircuits.makeCommitment(secret, rnBytes);
}

/**
 * Derive the random seed from secret, round number, and total pot.
 *
 * @param pureCircuits - The contract's pure circuits
 * @param secret - 32-byte secret revealed by operator
 * @param roundNumber - Round number
 * @param totalPot - Total pot amount
 * @returns 32-byte seed
 */
export function deriveSeed(
  pureCircuits: { deriveSeed: (secret: Uint8Array, rn: Uint8Array, pot: Uint8Array) => Uint8Array },
  secret: Uint8Array,
  roundNumber: bigint,
  totalPot: bigint,
): Uint8Array {
  const rnBytes = bigintToBytes32(roundNumber);
  const potBytes = bigintToBytes32(totalPot);
  return pureCircuits.deriveSeed(secret, rnBytes, potBytes);
}

/**
 * Derive the progressive seed from the main seed and total pot.
 *
 * @param pureCircuits - The contract's pure circuits
 * @param seed - 32-byte main seed
 * @param totalPot - Total pot amount
 * @returns 32-byte progressive seed
 */
export function deriveProgressiveSeed(
  pureCircuits: { deriveProgressiveSeed: (seed: Uint8Array, pot: Uint8Array) => Uint8Array },
  seed: Uint8Array,
  totalPot: bigint,
): Uint8Array {
  const potBytes = bigintToBytes32(totalPot);
  return pureCircuits.deriveProgressiveSeed(seed, potBytes);
}

/**
 * Select weighted winner from bets using the random seed.
 * Matches the on-chain unrolled fold exactly.
 *
 * @param seed - 32-byte seed
 * @param bets - Array of active bets (player + amount)
 * @param totalPot - Total pot amount
 * @returns Winner's public key
 */
export function selectWeightedWinner(
  seed: Uint8Array,
  bets: ReadonlyArray<{ player: Uint8Array; amount: bigint }>,
  totalPot: bigint,
): Uint8Array {
  const seedUint = bytes32ToUint64(seed);
  const target = seedUint % totalPot;

  let cumWeight = 0n;
  for (const bet of bets) {
    cumWeight += bet.amount;
    if (target < cumWeight) {
      return bet.player;
    }
  }

  throw new Error('Winner not found — this should not happen with valid bets');
}

/**
 * Select progressive jackpot winner (equal probability by index).
 *
 * @param progSeed - 32-byte progressive seed
 * @param playerCount - Number of active players
 * @param bets - Array of active bets
 * @returns Winner's public key
 */
export function selectProgressiveWinner(
  progSeed: Uint8Array,
  playerCount: bigint,
  bets: ReadonlyArray<{ player: Uint8Array; amount: bigint }>,
): Uint8Array {
  const progSeedUint = bytes32ToUint64(progSeed);
  const winnerIndex = progSeedUint % playerCount;
  const idx = Number(winnerIndex);

  if (idx >= bets.length) {
    throw new Error(`Progressive winner index ${idx} out of bounds`);
  }

  return bets[idx].player;
}

/**
 * Check if the progressive jackpot is triggered.
 *
 * @param progSeed - 32-byte progressive seed
 * @param trigger - Progressive trigger denominator
 * @returns true if triggered
 */
export function isJackpotTriggered(
  progSeed: Uint8Array,
  trigger: bigint,
): boolean {
  const progSeedUint = bytes32ToUint64(progSeed);
  return (progSeedUint % trigger) === 0n;
}

/**
 * Compute fee amounts using integer math (matching on-chain multiplication check).
 *
 * @param totalPot - Total pot amount
 * @param houseFeeBps - House fee in basis points
 * @param progressiveBps - Progressive contribution in basis points
 * @returns Fee breakdown
 */
export function computeFees(
  totalPot: bigint,
  houseFeeBps: bigint,
  progressiveBps: bigint,
): { houseFee: bigint; progressiveAmount: bigint; payout: bigint } {
  // Must satisfy: fee * 10000 == totalPot * bps (on-chain verification)
  const houseFee = (totalPot * houseFeeBps) / 10000n;
  const progressiveAmount = (totalPot * progressiveBps) / 10000n;
  const payout = totalPot - houseFee - progressiveAmount;

  // Verify the multiplication check will pass on-chain
  if (houseFee * 10000n !== totalPot * houseFeeBps) {
    throw new Error('House fee rounding error — pot not evenly divisible');
  }
  if (progressiveAmount * 10000n !== totalPot * progressiveBps) {
    throw new Error('Progressive amount rounding error — pot not evenly divisible');
  }

  return { houseFee, progressiveAmount, payout };
}

/**
 * Verification parameters for on-chain modulo checks.
 * The contract has no % operator, so the operator pre-computes
 * quotient/remainder pairs and the contract verifies via multiplication.
 */
export interface VerificationParams {
  rngTarget: bigint;
  rngQuotient: bigint;
  progRemainder: bigint;
  progQuotient: bigint;
  progWinnerIndex: bigint;
  progWinnerQuotient: bigint;
}

/**
 * Compute verification parameters for resolveRound.
 * These are quotient/remainder pairs that the contract verifies
 * since Compact has no modulo operator.
 *
 * For 0 or 1 player rounds, returns all zeros (contract skips verification).
 */
export function computeVerificationParams(
  seed: Uint8Array,
  totalPot: bigint,
  progSeed: Uint8Array,
  progressiveTrigger: bigint,
  playerCount: bigint,
): VerificationParams {
  if (playerCount <= 1n) {
    return {
      rngTarget: 0n,
      rngQuotient: 0n,
      progRemainder: 0n,
      progQuotient: 0n,
      progWinnerIndex: 0n,
      progWinnerQuotient: 0n,
    };
  }

  const seedUint = bytes32ToUint64(seed);
  const rngTarget = seedUint % totalPot;
  const rngQuotient = seedUint / totalPot;

  const progSeedUint = bytes32ToUint64(progSeed);
  const progRemainder = progSeedUint % progressiveTrigger;
  const progQuotient = progSeedUint / progressiveTrigger;
  const progWinnerIndex = progSeedUint % playerCount;
  const progWinnerQuotient = progSeedUint / playerCount;

  return { rngTarget, rngQuotient, progRemainder, progQuotient, progWinnerIndex, progWinnerQuotient };
}

/**
 * Convert bigint to 32-byte big-endian Uint8Array (as Field -> Bytes<32>).
 */
export function bigintToBytes32(value: bigint): Uint8Array {
  const bytes = new Uint8Array(32);
  let v = value;
  for (let i = 31; i >= 0; i--) {
    bytes[i] = Number(v & 0xFFn);
    v >>= 8n;
  }
  return bytes;
}

/**
 * Extract lower 8 bytes of a 32-byte hash as Uint<64> (matching on-chain cast).
 * Uses big-endian interpretation of the last 8 bytes.
 */
export function bytes32ToUint64(bytes: Uint8Array): bigint {
  let result = 0n;
  // Last 8 bytes (indices 24-31) in big-endian
  for (let i = 24; i < 32; i++) {
    result = (result << 8n) | BigInt(bytes[i]);
  }
  return result;
}
