import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LifecycleManager, OperatorState } from './lifecycle.js';
import { RoundStatus, type GameState, type TxResult } from '@shadow-sniper/api';
import { SecretManager } from './secret-manager.js';

// Mock types
type MockApi = {
  getState: ReturnType<typeof vi.fn>;
  startRound: ReturnType<typeof vi.fn>;
  resolveRound: ReturnType<typeof vi.fn>;
  cancelRound: ReturnType<typeof vi.fn>;
  pureCircuits: {
    makeCommitment: ReturnType<typeof vi.fn>;
    deriveSeed: ReturnType<typeof vi.fn>;
    deriveProgressiveSeed: ReturnType<typeof vi.fn>;
  };
};

function createMockApi(): MockApi {
  return {
    getState: vi.fn(),
    startRound: vi.fn().mockResolvedValue({ txHash: 'tx123', blockHeight: 1 } as TxResult),
    resolveRound: vi.fn().mockResolvedValue({ txHash: 'tx456', blockHeight: 2 } as TxResult),
    cancelRound: vi.fn().mockResolvedValue({ txHash: 'tx789', blockHeight: 3 } as TxResult),
    pureCircuits: {
      makeCommitment: vi.fn().mockReturnValue(new Uint8Array(32)),
      deriveSeed: vi.fn().mockReturnValue(new Uint8Array(32)),
      deriveProgressiveSeed: vi.fn().mockReturnValue(new Uint8Array(32)),
    },
  };
}

function createMockState(overrides: Partial<GameState> = {}): GameState {
  return {
    config: {
      operator: new Uint8Array(32),
      minBet: 100n,
      maxBet: 10000n,
      roundDurationSecs: 300n,
      houseFeeBps: 300n,
      progressiveBps: 100n,
      progressiveTrigger: 100n,
      resolveDeadlineSecs: 300n,
    },
    roundStatus: RoundStatus.Resolved,
    roundNumber: 1n,
    commitment: new Uint8Array(32),
    roundEndTime: 0n,
    roundDeadline: 0n,
    playerCount: 0n,
    totalPot: 0n,
    bets: Array.from({ length: 10 }, () => ({
      active: false,
      player: new Uint8Array(32),
      amount: 0n,
    })),
    progressivePool: 0n,
    houseBalance: 0n,
    lastResult: {
      winner: new Uint8Array(32),
      payout: 0n,
      jackpotWinner: new Uint8Array(32),
      jackpotAmount: 0n,
    },
    totalRoundsPlayed: 0n,
    ...overrides,
  };
}

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  trace: vi.fn(),
} as any;

describe('LifecycleManager', () => {
  let api: MockApi;
  let secretManager: SecretManager;
  let lifecycle: LifecycleManager;

  beforeEach(() => {
    vi.clearAllMocks();
    api = createMockApi();
    // Use a temp path that won't persist between tests
    secretManager = new SecretManager('/tmp/test-secrets-' + Date.now() + '.json', mockLogger);
    lifecycle = new LifecycleManager(api as any, secretManager, mockLogger, 3);
  });

  it('should start in IDLE state', () => {
    expect(lifecycle.currentState).toBe(OperatorState.IDLE);
  });

  it('should start a new round when contract is in resolved state', async () => {
    const state = createMockState({ roundStatus: RoundStatus.Resolved });
    api.getState.mockResolvedValue(state);

    const shouldContinue = await lifecycle.tick();

    expect(shouldContinue).toBe(true);
    expect(api.startRound).toHaveBeenCalled();
    expect(lifecycle.currentState).toBe(OperatorState.OPEN);
  });

  it('should stay in OPEN state when round is open', async () => {
    const state = createMockState({ roundStatus: RoundStatus.Open });
    api.getState.mockResolvedValue(state);

    await lifecycle.tick();

    expect(lifecycle.currentState).toBe(OperatorState.OPEN);
    expect(api.startRound).not.toHaveBeenCalled();
    expect(api.resolveRound).not.toHaveBeenCalled();
  });

  it('should resolve round with 0 players', async () => {
    // First, store a secret so the manager can find it
    secretManager.store(1n, new Uint8Array(32).fill(0xAA));

    const state = createMockState({
      roundStatus: RoundStatus.WaitingToResolve,
      playerCount: 0n,
      totalPot: 0n,
    });
    api.getState.mockResolvedValue(state);

    await lifecycle.tick();

    expect(api.resolveRound).toHaveBeenCalledWith(
      expect.any(Uint8Array),
      expect.any(Uint8Array),
      0n, 0n, 0n,
      false,
      expect.any(Uint8Array),
      0n, 0n, 0n, 0n, 0n, 0n,
    );
  });

  it('should refund single player', async () => {
    secretManager.store(1n, new Uint8Array(32).fill(0xBB));

    const player = new Uint8Array(32).fill(1);
    const bets = Array.from({ length: 10 }, () => ({
      active: false,
      player: new Uint8Array(32),
      amount: 0n,
    }));
    bets[0] = { active: true, player, amount: 500n };

    const state = createMockState({
      roundStatus: RoundStatus.WaitingToResolve,
      playerCount: 1n,
      totalPot: 500n,
      bets,
    });
    api.getState.mockResolvedValue(state);

    await lifecycle.tick();

    expect(api.resolveRound).toHaveBeenCalledWith(
      expect.any(Uint8Array),
      player,
      500n,
      0n, 0n,
      false,
      expect.any(Uint8Array),
      0n, 0n, 0n, 0n, 0n, 0n,
    );
  });

  it('should cancel expired rounds', async () => {
    const state = createMockState({ roundStatus: RoundStatus.Expired });
    api.getState.mockResolvedValue(state);

    await lifecycle.tick();

    expect(api.cancelRound).toHaveBeenCalled();
    expect(lifecycle.currentState).toBe(OperatorState.IDLE);
  });

  it('should count consecutive errors', async () => {
    api.getState.mockRejectedValue(new Error('Network error'));

    const result1 = await lifecycle.tick();
    expect(result1).toBe(true);
    expect(lifecycle.errorCount).toBe(1);

    const result2 = await lifecycle.tick();
    expect(result2).toBe(true);
    expect(lifecycle.errorCount).toBe(2);
  });

  it('should shutdown after max consecutive errors', async () => {
    api.getState.mockRejectedValue(new Error('Network error'));

    await lifecycle.tick(); // 1
    await lifecycle.tick(); // 2
    const result = await lifecycle.tick(); // 3 = max

    expect(result).toBe(false);
  });

  it('should reset error count on success', async () => {
    api.getState.mockRejectedValueOnce(new Error('fail'));
    await lifecycle.tick();
    expect(lifecycle.errorCount).toBe(1);

    api.getState.mockResolvedValueOnce(createMockState({ roundStatus: RoundStatus.Open }));
    await lifecycle.tick();
    expect(lifecycle.errorCount).toBe(0);
  });
});
