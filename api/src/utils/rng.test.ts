import { describe, it, expect } from 'vitest';
import {
  generateSecret,
  selectWeightedWinner,
  selectProgressiveWinner,
  isJackpotTriggered,
  computeFees,
  bigintToBytes32,
  bytes32ToUint64,
} from './rng.js';

describe('generateSecret', () => {
  it('should generate a 32-byte secret', () => {
    const secret = generateSecret();
    expect(secret).toBeInstanceOf(Uint8Array);
    expect(secret.length).toBe(32);
  });

  it('should generate unique secrets', () => {
    const s1 = generateSecret();
    const s2 = generateSecret();
    expect(Buffer.from(s1).toString('hex')).not.toBe(Buffer.from(s2).toString('hex'));
  });
});

describe('bigintToBytes32', () => {
  it('should convert 0 to all zeros', () => {
    const bytes = bigintToBytes32(0n);
    expect(bytes.length).toBe(32);
    expect(bytes.every((b) => b === 0)).toBe(true);
  });

  it('should convert 1 to bytes with last byte = 1', () => {
    const bytes = bigintToBytes32(1n);
    expect(bytes[31]).toBe(1);
    expect(bytes.slice(0, 31).every((b) => b === 0)).toBe(true);
  });

  it('should convert 256 correctly', () => {
    const bytes = bigintToBytes32(256n);
    expect(bytes[30]).toBe(1);
    expect(bytes[31]).toBe(0);
  });
});

describe('bytes32ToUint64', () => {
  it('should extract lower 8 bytes', () => {
    const bytes = new Uint8Array(32);
    bytes[31] = 42;
    expect(bytes32ToUint64(bytes)).toBe(42n);
  });

  it('should handle larger values', () => {
    const bytes = new Uint8Array(32);
    bytes[24] = 1; // 2^56
    expect(bytes32ToUint64(bytes)).toBe(72057594037927936n);
  });

  it('should roundtrip through bigintToBytes32', () => {
    const original = 123456789n;
    const bytes = bigintToBytes32(original);
    const result = bytes32ToUint64(bytes);
    expect(result).toBe(original);
  });
});

describe('selectWeightedWinner', () => {
  const player1 = new Uint8Array(32).fill(1);
  const player2 = new Uint8Array(32).fill(2);
  const player3 = new Uint8Array(32).fill(3);

  it('should select based on cumulative weight', () => {
    // Create a seed that produces target = 0 (which falls in player1's range)
    const bets = [
      { player: player1, amount: 500n },
      { player: player2, amount: 300n },
      { player: player3, amount: 200n },
    ];

    // Seed that gives target 0 when % 1000
    const seed = bigintToBytes32(1000n); // 1000 % 1000 = 0
    const winner = selectWeightedWinner(seed, bets, 1000n);
    // target = 0, cumWeight after player1 = 500, 0 < 500 => player1 wins
    expect(Buffer.from(winner)).toEqual(Buffer.from(player1));
  });

  it('should select player2 when target is in their range', () => {
    const bets = [
      { player: player1, amount: 500n },
      { player: player2, amount: 300n },
      { player: player3, amount: 200n },
    ];

    // target = 650, player1 [0,500), player2 [500,800), player3 [800,1000)
    const seed = bigintToBytes32(650n);
    const winner = selectWeightedWinner(seed, bets, 1000n);
    expect(Buffer.from(winner)).toEqual(Buffer.from(player2));
  });

  it('should select player3 when target is in their range', () => {
    const bets = [
      { player: player1, amount: 500n },
      { player: player2, amount: 300n },
      { player: player3, amount: 200n },
    ];

    // target = 900, player3's range is [800,1000)
    const seed = bigintToBytes32(900n);
    const winner = selectWeightedWinner(seed, bets, 1000n);
    expect(Buffer.from(winner)).toEqual(Buffer.from(player3));
  });

  it('should handle equal bets', () => {
    const bets = [
      { player: player1, amount: 100n },
      { player: player2, amount: 100n },
    ];

    // target = 0, cumWeight after player1 = 100, 0 < 100 => player1
    const seed = bigintToBytes32(200n); // 200 % 200 = 0
    const winner = selectWeightedWinner(seed, bets, 200n);
    expect(Buffer.from(winner)).toEqual(Buffer.from(player1));
  });

  it('should handle single player', () => {
    const bets = [{ player: player1, amount: 500n }];
    const seed = bigintToBytes32(0n);
    const winner = selectWeightedWinner(seed, bets, 500n);
    expect(Buffer.from(winner)).toEqual(Buffer.from(player1));
  });
});

describe('selectProgressiveWinner', () => {
  const player1 = new Uint8Array(32).fill(1);
  const player2 = new Uint8Array(32).fill(2);
  const player3 = new Uint8Array(32).fill(3);

  it('should select by index with equal probability', () => {
    const bets = [
      { player: player1, amount: 100n },
      { player: player2, amount: 200n },
      { player: player3, amount: 300n },
    ];

    // progSeedUint % 3 = index
    const seed0 = bigintToBytes32(0n); // 0 % 3 = 0 => player1
    expect(Buffer.from(selectProgressiveWinner(seed0, 3n, bets))).toEqual(Buffer.from(player1));

    const seed1 = bigintToBytes32(1n); // 1 % 3 = 1 => player2
    expect(Buffer.from(selectProgressiveWinner(seed1, 3n, bets))).toEqual(Buffer.from(player2));

    const seed2 = bigintToBytes32(2n); // 2 % 3 = 2 => player3
    expect(Buffer.from(selectProgressiveWinner(seed2, 3n, bets))).toEqual(Buffer.from(player3));
  });
});

describe('isJackpotTriggered', () => {
  it('should trigger when seed mod trigger == 0', () => {
    const seed = bigintToBytes32(100n); // 100 % 100 = 0
    expect(isJackpotTriggered(seed, 100n)).toBe(true);
  });

  it('should not trigger when seed mod trigger != 0', () => {
    const seed = bigintToBytes32(42n); // 42 % 100 = 42
    expect(isJackpotTriggered(seed, 100n)).toBe(false);
  });

  it('should always trigger with trigger = 1', () => {
    const seed = bigintToBytes32(999n);
    expect(isJackpotTriggered(seed, 1n)).toBe(true);
  });
});

describe('computeFees', () => {
  it('should compute 3% house fee and 1% progressive', () => {
    const { houseFee, progressiveAmount, payout } = computeFees(10000n, 300n, 100n);
    expect(houseFee).toBe(300n);
    expect(progressiveAmount).toBe(100n);
    expect(payout).toBe(9600n);
  });

  it('should verify multiplication check passes', () => {
    const { houseFee, progressiveAmount } = computeFees(10000n, 300n, 100n);
    // On-chain check: fee * 10000 == pot * bps
    expect(houseFee * 10000n).toBe(10000n * 300n);
    expect(progressiveAmount * 10000n).toBe(10000n * 100n);
  });

  it('should handle zero fees', () => {
    const { houseFee, progressiveAmount, payout } = computeFees(10000n, 0n, 0n);
    expect(houseFee).toBe(0n);
    expect(progressiveAmount).toBe(0n);
    expect(payout).toBe(10000n);
  });

  it('should throw on rounding errors', () => {
    // 333 bps on 100 pot: 100 * 333 / 10000 = 3.33 — not integer divisible
    expect(() => computeFees(100n, 333n, 0n)).toThrow('rounding error');
  });
});
