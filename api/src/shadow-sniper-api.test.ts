/**
 * ShadowSniper API Unit Tests
 *
 * Tests for the TypeScript API wrapper
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ShadowSniperAPI, RoundState } from './index.js';
import { generateSecret, createCommitment, verifyCommitment, deriveSecret, bytesToHex, hexToBytes } from './utils/rng.js';
import { formatDuration, getTimeRemaining, isRoundOpen, isReadyToResolve, hasPassedDeadline } from './utils/time.js';

describe('ShadowSniperAPI', () => {
  describe('deploy', () => {
    it('should validate configuration before deploying', async () => {
      const api = new ShadowSniperAPI();

      await assert.rejects(
        async () => api.deploy({ operatorAddress: '0x123', minBet: 0n }),
        { message: 'minBet must be positive' }
      );

      await assert.rejects(
        async () => api.deploy({ operatorAddress: '0x123', minBet: 1000n, maxBet: 100n }),
        { message: 'maxBet must be >= minBet' }
      );

      await assert.rejects(
        async () => api.deploy({
          operatorAddress: '0x123',
          houseFeePercent: 50n,
          progressivePercent: 50n
        }),
        { message: 'Combined fees must be < 100%' }
      );
    });

    it('should use default configuration values', async () => {
      const api = new ShadowSniperAPI();
      const deployment = await api.deploy({ operatorAddress: '0x123' });

      assert.ok(deployment.contractAddress);
      assert.ok(deployment.transactionHash);
      assert.strictEqual(typeof deployment.blockNumber, 'bigint');
    });
  });

  describe('placeBet', () => {
    it('should validate bet amount', async () => {
      const api = new ShadowSniperAPI();
      api.connect('0x123');

      await assert.rejects(
        async () => api.placeBet(0n),
        { message: 'Bet amount must be positive' }
      );

      await assert.rejects(
        async () => api.placeBet(-100n),
        { message: 'Bet amount must be positive' }
      );
    });
  });

  describe('updateConfig', () => {
    it('should validate new configuration', async () => {
      const api = new ShadowSniperAPI();
      api.connect('0x123');

      await assert.rejects(
        async () => api.updateConfig({
          minBet: 0n,
          maxBet: 1000n,
          roundDuration: 300000n,
          houseFeePercent: 3n,
          progressivePercent: 1n,
          progressiveTriggerPercent: 1n,
          resolveDeadline: 300000n
        }),
        { message: 'minBet must be positive' }
      );

      await assert.rejects(
        async () => api.updateConfig({
          minBet: 1000n,
          maxBet: 100n,
          roundDuration: 300000n,
          houseFeePercent: 3n,
          progressivePercent: 1n,
          progressiveTriggerPercent: 1n,
          resolveDeadline: 300000n
        }),
        { message: 'maxBet must be >= minBet' }
      );

      await assert.rejects(
        async () => api.updateConfig({
          minBet: 100n,
          maxBet: 1000n,
          roundDuration: 300000n,
          houseFeePercent: 50n,
          progressivePercent: 50n,
          progressiveTriggerPercent: 1n,
          resolveDeadline: 300000n
        }),
        { message: 'Combined fees must be < 100%' }
      );
    });
  });

  describe('withdrawHouseFees', () => {
    it('should validate withdrawal amount', async () => {
      const api = new ShadowSniperAPI();
      api.connect('0x123');

      await assert.rejects(
        async () => api.withdrawHouseFees(0n),
        { message: 'Withdrawal amount must be positive' }
      );
    });
  });

  describe('connection management', () => {
    it('should require connection before operations', async () => {
      const api = new ShadowSniperAPI();

      await assert.rejects(
        async () => api.getGameState(),
        { message: /Not connected/ }
      );

      await assert.rejects(
        async () => api.startRound(new Uint8Array(32)),
        { message: /Not connected/ }
      );
    });

    it('should allow operations after connect', async () => {
      const api = new ShadowSniperAPI();
      api.connect('0x123');

      // Should not throw
      await api.getGameState();
    });
  });
});

describe('RNG Utilities', () => {
  describe('generateSecret', () => {
    it('should generate 32-byte secret', () => {
      const secret = generateSecret();
      assert.strictEqual(secret.length, 32);
    });

    it('should generate different secrets', () => {
      const secret1 = generateSecret();
      const secret2 = generateSecret();
      assert.notDeepStrictEqual(secret1, secret2);
    });
  });

  describe('createCommitment', () => {
    it('should create valid 32-byte commitment', () => {
      const secret = generateSecret();
      const commitment = createCommitment(secret, 1n);
      assert.strictEqual(commitment.length, 32);
    });

    it('should create different commitments for different round numbers', () => {
      const secret = generateSecret();
      const commitment1 = createCommitment(secret, 1n);
      const commitment2 = createCommitment(secret, 2n);
      assert.notDeepStrictEqual(commitment1, commitment2);
    });

    it('should create different commitments for different secrets', () => {
      const secret1 = generateSecret();
      const secret2 = generateSecret();
      const commitment1 = createCommitment(secret1, 1n);
      const commitment2 = createCommitment(secret2, 1n);
      assert.notDeepStrictEqual(commitment1, commitment2);
    });
  });

  describe('verifyCommitment', () => {
    it('should verify correct secret and round number', () => {
      const secret = generateSecret();
      const roundNumber = 1n;
      const commitment = createCommitment(secret, roundNumber);

      const isValid = verifyCommitment(secret, roundNumber, commitment);
      assert.strictEqual(isValid, true);
    });

    it('should reject wrong secret', () => {
      const secret1 = generateSecret();
      const secret2 = generateSecret();
      const commitment = createCommitment(secret1, 1n);

      const isValid = verifyCommitment(secret2, 1n, commitment);
      assert.strictEqual(isValid, false);
    });

    it('should reject wrong round number', () => {
      const secret = generateSecret();
      const commitment = createCommitment(secret, 1n);

      const isValid = verifyCommitment(secret, 2n, commitment);
      assert.strictEqual(isValid, false);
    });
  });

  describe('deriveSecret', () => {
    it('should derive deterministic secret from master key', () => {
      const masterKey = generateSecret();
      const secret1 = deriveSecret(masterKey, 1n);
      const secret2 = deriveSecret(masterKey, 1n);

      assert.deepStrictEqual(secret1, secret2);
    });

    it('should derive different secrets for different round numbers', () => {
      const masterKey = generateSecret();
      const secret1 = deriveSecret(masterKey, 1n);
      const secret2 = deriveSecret(masterKey, 2n);

      assert.notDeepStrictEqual(secret1, secret2);
    });

    it('should derive different secrets for different master keys', () => {
      const masterKey1 = generateSecret();
      const masterKey2 = generateSecret();
      const secret1 = deriveSecret(masterKey1, 1n);
      const secret2 = deriveSecret(masterKey2, 1n);

      assert.notDeepStrictEqual(secret1, secret2);
    });
  });

  describe('bytesToHex / hexToBytes', () => {
    it('should convert bytes to hex and back', () => {
      const original = generateSecret();
      const hex = bytesToHex(original);
      const restored = hexToBytes(hex);

      // Compare as buffers since restored is Uint8Array
      assert.deepStrictEqual(Buffer.from(restored), Buffer.from(original));
    });

    it('should handle 0x prefix', () => {
      const bytes = new Uint8Array([0xaa, 0xbb, 0xcc]);
      const hex1 = hexToBytes('aabbcc');
      const hex2 = hexToBytes('0xaabbcc');

      assert.deepStrictEqual(hex1, bytes);
      assert.deepStrictEqual(hex2, bytes);
    });
  });
});

describe('Time Utilities', () => {
  describe('formatDuration', () => {
    it('should format seconds', () => {
      assert.strictEqual(formatDuration(5000n), '5s');
      assert.strictEqual(formatDuration(45000n), '45s');
    });

    it('should format minutes and seconds', () => {
      assert.strictEqual(formatDuration(60000n), '1m 0s');
      assert.strictEqual(formatDuration(90000n), '1m 30s');
      assert.strictEqual(formatDuration(300000n), '5m 0s');
    });

    it('should format hours and minutes', () => {
      assert.strictEqual(formatDuration(3600000n), '1h 0m');
      assert.strictEqual(formatDuration(5400000n), '1h 30m');
    });
  });

  describe('getTimeRemaining', () => {
    it('should calculate time remaining', () => {
      const currentTime = 1000000n;
      const deadline = 1005000n;

      const remaining = getTimeRemaining(deadline, currentTime);
      assert.strictEqual(remaining, 5000n);
    });

    it('should return 0 when deadline passed', () => {
      const currentTime = 1005000n;
      const deadline = 1000000n;

      const remaining = getTimeRemaining(deadline, currentTime);
      assert.strictEqual(remaining, 0n);
    });
  });

  describe('isRoundOpen', () => {
    it('should return true when current time is within round', () => {
      const startTime = 1000000n;
      const endTime = 1300000n;
      const currentTime = 1150000n;

      assert.strictEqual(isRoundOpen(startTime, endTime, currentTime), true);
    });

    it('should return false when before start time', () => {
      const startTime = 1000000n;
      const endTime = 1300000n;
      const currentTime = 999999n;

      assert.strictEqual(isRoundOpen(startTime, endTime, currentTime), false);
    });

    it('should return false when after end time', () => {
      const startTime = 1000000n;
      const endTime = 1300000n;
      const currentTime = 1300001n;

      assert.strictEqual(isRoundOpen(startTime, endTime, currentTime), false);
    });

    it('should return true at exact start time', () => {
      const startTime = 1000000n;
      const endTime = 1300000n;

      assert.strictEqual(isRoundOpen(startTime, endTime, startTime), true);
    });

    it('should return false at exact end time', () => {
      const startTime = 1000000n;
      const endTime = 1300000n;

      assert.strictEqual(isRoundOpen(startTime, endTime, endTime), false);
    });
  });

  describe('isReadyToResolve', () => {
    it('should return true when past end time', () => {
      const endTime = 1000000n;
      const currentTime = 1000001n;

      assert.strictEqual(isReadyToResolve(endTime, currentTime), true);
    });

    it('should return false before end time', () => {
      const endTime = 1000000n;
      const currentTime = 999999n;

      assert.strictEqual(isReadyToResolve(endTime, currentTime), false);
    });

    it('should return true at exact end time', () => {
      const endTime = 1000000n;

      assert.strictEqual(isReadyToResolve(endTime, endTime), true);
    });
  });

  describe('hasPassedDeadline', () => {
    it('should return true when past deadline', () => {
      const deadline = 1000000n;
      const currentTime = 1000001n;

      assert.strictEqual(hasPassedDeadline(deadline, currentTime), true);
    });

    it('should return false before deadline', () => {
      const deadline = 1000000n;
      const currentTime = 999999n;

      assert.strictEqual(hasPassedDeadline(deadline, currentTime), false);
    });

    it('should return false at exact deadline', () => {
      const deadline = 1000000n;

      assert.strictEqual(hasPassedDeadline(deadline, deadline), false);
    });
  });
});
