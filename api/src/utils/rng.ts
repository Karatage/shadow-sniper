/**
 * RNG commitment generation utilities for the operator
 */

import { createHash, randomBytes } from 'crypto';

/**
 * Generate a random secret for RNG commitment
 */
export function generateSecret(): Uint8Array {
  return randomBytes(32);
}

/**
 * Create a commitment hash from secret and round number
 * commitment = sha256(secret || roundNumber)
 */
export function createCommitment(secret: Uint8Array, roundNumber: bigint): Uint8Array {
  const roundBytes = Buffer.alloc(32);
  // Convert bigint to bytes (big-endian)
  let num = roundNumber;
  for (let i = 31; i >= 0; i--) {
    roundBytes[i] = Number(num & 0xFFn);
    num >>= 8n;
  }

  const preimage = Buffer.concat([Buffer.from(secret), roundBytes]);
  return new Uint8Array(createHash('sha256').update(preimage).digest());
}

/**
 * Verify a commitment matches the revealed secret and round number
 */
export function verifyCommitment(
  secret: Uint8Array,
  roundNumber: bigint,
  commitment: Uint8Array
): boolean {
  const computed = createCommitment(secret, roundNumber);
  return Buffer.from(computed).equals(Buffer.from(commitment));
}

/**
 * Derive a deterministic secret from a master key and round number
 * Allows operator to recover secrets without storing each one
 */
export function deriveSecret(masterKey: Uint8Array, roundNumber: bigint): Uint8Array {
  const roundBytes = Buffer.alloc(32);
  let num = roundNumber;
  for (let i = 31; i >= 0; i--) {
    roundBytes[i] = Number(num & 0xFFn);
    num >>= 8n;
  }

  const preimage = Buffer.concat([Buffer.from(masterKey), roundBytes]);
  return new Uint8Array(createHash('sha256').update(preimage).digest());
}

/**
 * Convert Uint8Array to hex string for display
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}

/**
 * Convert hex string to Uint8Array
 */
export function hexToBytes(hex: string): Uint8Array {
  if (hex.startsWith('0x')) {
    hex = hex.slice(2);
  }
  return new Uint8Array(Buffer.from(hex, 'hex'));
}
