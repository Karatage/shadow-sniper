/**
 * ShadowSniper API - TypeScript wrapper for the Compact smart contract
 *
 * This class provides a high-level interface for interacting with the
 * ShadowSniper contract on Midnight Network.
 */

import {
  RoundState,
  RoundConfig,
  Bet,
  Round,
  RoundResult,
  GameState,
  DeploymentConfig,
  ContractDeployment,
  TransactionResult
} from './types.js';
import { createCommitment, verifyCommitment } from './utils/rng.js';
import { isRoundOpen, isReadyToResolve, hasPassedDeadline } from './utils/time.js';

/**
 * Main API class for ShadowSniper contract interactions
 */
export class ShadowSniperAPI {
  private contractAddress: string | null = null;

  constructor() {
    // TODO: Initialize Midnight SDK provider when available
  }

  /**
   * Deploy a new ShadowSniper contract
   */
  async deploy(config: DeploymentConfig): Promise<ContractDeployment> {
    const {
      operatorAddress,
      minBet = 100n,  // 0.1 NIGHT
      maxBet = 10_000n,  // 10 NIGHT
      roundDuration = 300_000n,  // 5 minutes
      houseFeePercent = 3n,  // 3%
      progressivePercent = 1n,  // 1%
      progressiveTriggerPercent = 1n,  // 1% chance
      resolveDeadline = 300_000n  // 5 minutes
    } = config;

    // Validate configuration
    if (minBet <= 0n) {
      throw new Error('minBet must be positive');
    }
    if (maxBet < minBet) {
      throw new Error('maxBet must be >= minBet');
    }
    if (houseFeePercent + progressivePercent >= 100n) {
      throw new Error('Combined fees must be < 100%');
    }

    // TODO: Deploy contract using Midnight SDK
    // const deployment = await midnightProvider.deploy(
    //   ShadowSniperContract,
    //   operatorAddress,
    //   minBet,
    //   maxBet,
    //   roundDuration,
    //   houseFeePercent,
    //   progressivePercent,
    //   progressiveTriggerPercent,
    //   resolveDeadline
    // );

    // Placeholder return
    const mockAddress = '0x' + '1'.repeat(64);
    this.contractAddress = mockAddress;

    return {
      contractAddress: mockAddress,
      transactionHash: '0x' + 'a'.repeat(64),
      blockNumber: 1n
    };
  }

  /**
   * Connect to an existing deployed contract
   */
  connect(contractAddress: string): void {
    this.contractAddress = contractAddress;
    // TODO: Initialize contract instance with Midnight SDK
  }

  /**
   * Get current game state from the ledger
   */
  async getGameState(): Promise<GameState> {
    this.ensureConnected();

    // TODO: Query ledger state from Midnight indexer or node
    // const state = await this.contract.getLedgerState();

    // Placeholder return
    return {
      operator: '0x' + '0'.repeat(64),
      config: {
        minBet: 100n,
        maxBet: 10_000n,
        roundDuration: 300_000n,
        houseFeePercent: 3n,
        progressivePercent: 1n,
        progressiveTriggerPercent: 1n,
        resolveDeadline: 300_000n
      },
      currentRound: {
        roundNumber: 0n,
        state: RoundState.RESOLVED,
        commitment: new Uint8Array(32),
        startTime: 0n,
        endTime: 0n,
        resolveDeadline: 0n,
        totalPot: 0n,
        playerCount: 0n
      },
      bets: [],
      progressivePool: 0n,
      houseBalance: 0n,
      totalRounds: 0n,
      lastResult: null
    };
  }

  /**
   * Start a new round (operator only)
   */
  async startRound(commitment: Uint8Array): Promise<TransactionResult> {
    this.ensureConnected();

    if (commitment.length !== 32) {
      throw new Error('Commitment must be 32 bytes');
    }

    // TODO: Call startRound circuit with Midnight SDK
    // const tx = await this.contract.startRound(commitment);
    // await tx.wait();

    return {
      success: true,
      transactionHash: '0x' + 'b'.repeat(64)
    };
  }

  /**
   * Place a bet in the current round
   */
  async placeBet(amount: bigint): Promise<TransactionResult> {
    this.ensureConnected();

    if (amount <= 0n) {
      throw new Error('Bet amount must be positive');
    }

    const state = await this.getGameState();

    if (state.currentRound.state !== RoundState.OPEN) {
      throw new Error('Round is not open for bets');
    }

    if (amount < state.config.minBet) {
      throw new Error(`Bet below minimum of ${state.config.minBet}`);
    }

    if (amount > state.config.maxBet) {
      throw new Error(`Bet above maximum of ${state.config.maxBet}`);
    }

    // TODO: Call placeBet circuit with Midnight SDK
    // const tx = await this.contract.placeBet(amount);
    // await tx.wait();

    return {
      success: true,
      transactionHash: '0x' + 'c'.repeat(64)
    };
  }

  /**
   * Resolve the current round by revealing the secret (operator only)
   */
  async resolveRound(secret: Uint8Array): Promise<TransactionResult> {
    this.ensureConnected();

    if (secret.length !== 32) {
      throw new Error('Secret must be 32 bytes');
    }

    const state = await this.getGameState();

    if (!isReadyToResolve(state.currentRound.endTime)) {
      throw new Error('Round has not ended yet');
    }

    if (hasPassedDeadline(state.currentRound.resolveDeadline)) {
      throw new Error('Resolve deadline has passed, use cancelRound instead');
    }

    // Verify commitment locally before submitting
    if (!verifyCommitment(secret, state.currentRound.roundNumber, state.currentRound.commitment)) {
      throw new Error('Secret does not match commitment');
    }

    // TODO: Call resolveRound circuit with Midnight SDK
    // const tx = await this.contract.resolveRound(secret);
    // await tx.wait();

    return {
      success: true,
      transactionHash: '0x' + 'd'.repeat(64)
    };
  }

  /**
   * Cancel the round and refund all bets (anyone can call after deadline)
   */
  async cancelRound(): Promise<TransactionResult> {
    this.ensureConnected();

    const state = await this.getGameState();

    if (!hasPassedDeadline(state.currentRound.resolveDeadline)) {
      throw new Error('Resolve deadline has not passed yet');
    }

    // TODO: Call cancelRound circuit with Midnight SDK
    // const tx = await this.contract.cancelRound();
    // await tx.wait();

    return {
      success: true,
      transactionHash: '0x' + 'e'.repeat(64)
    };
  }

  /**
   * Update game configuration (operator only, between rounds)
   */
  async updateConfig(config: RoundConfig): Promise<TransactionResult> {
    this.ensureConnected();

    const state = await this.getGameState();

    if (state.currentRound.state !== RoundState.RESOLVED) {
      throw new Error('Cannot update config during active round');
    }

    // Validate configuration
    if (config.minBet <= 0n) {
      throw new Error('minBet must be positive');
    }
    if (config.maxBet < config.minBet) {
      throw new Error('maxBet must be >= minBet');
    }
    if (config.houseFeePercent + config.progressivePercent >= 100n) {
      throw new Error('Combined fees must be < 100%');
    }

    // TODO: Call updateConfig circuit with Midnight SDK
    // const tx = await this.contract.updateConfig(...);
    // await tx.wait();

    return {
      success: true,
      transactionHash: '0x' + 'f'.repeat(64)
    };
  }

  /**
   * Withdraw accumulated house fees (operator only)
   */
  async withdrawHouseFees(amount: bigint): Promise<TransactionResult> {
    this.ensureConnected();

    if (amount <= 0n) {
      throw new Error('Withdrawal amount must be positive');
    }

    const state = await this.getGameState();

    if (amount > state.houseBalance) {
      throw new Error('Insufficient house balance');
    }

    // TODO: Call withdrawHouseFees circuit with Midnight SDK
    // const tx = await this.contract.withdrawHouseFees(amount);
    // await tx.wait();

    return {
      success: true,
      transactionHash: '0x' + '1'.repeat(64)
    };
  }

  /**
   * Get all bets in the current round
   */
  async getCurrentBets(): Promise<Bet[]> {
    const state = await this.getGameState();
    return state.bets;
  }

  /**
   * Get the last round result
   */
  async getLastResult(): Promise<RoundResult | null> {
    const state = await this.getGameState();
    return state.lastResult;
  }

  /**
   * Get progressive jackpot pool amount
   */
  async getProgressivePool(): Promise<bigint> {
    const state = await this.getGameState();
    return state.progressivePool;
  }

  /**
   * Get house balance
   */
  async getHouseBalance(): Promise<bigint> {
    const state = await this.getGameState();
    return state.houseBalance;
  }

  private ensureConnected(): void {
    if (!this.contractAddress) {
      throw new Error('Not connected to contract. Call deploy() or connect() first.');
    }
  }
}
