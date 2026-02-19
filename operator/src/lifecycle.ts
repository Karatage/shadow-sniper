/**
 * Round lifecycle state machine for the operator service.
 *
 * States: IDLE → STARTING → OPEN → WAITING_TO_RESOLVE → RESOLVING → IDLE
 *                                            ↓ (timeout)
 *                                        CANCELLING → IDLE
 *
 * @module
 */

import { type Logger } from 'pino';
import { ShadowSniperAPI, utils, type GameState, RoundStatus } from '@shadow-sniper/api';
import { SecretManager } from './secret-manager.js';

export enum OperatorState {
  IDLE = 'IDLE',
  STARTING = 'STARTING',
  OPEN = 'OPEN',
  WAITING_TO_RESOLVE = 'WAITING_TO_RESOLVE',
  RESOLVING = 'RESOLVING',
  CANCELLING = 'CANCELLING',
}

export class LifecycleManager {
  private state = OperatorState.IDLE;
  private consecutiveErrors = 0;

  constructor(
    private readonly api: ShadowSniperAPI,
    private readonly secretManager: SecretManager,
    private readonly logger: Logger,
    private readonly maxConsecutiveErrors: number,
  ) {}

  get currentState(): OperatorState {
    return this.state;
  }

  get errorCount(): number {
    return this.consecutiveErrors;
  }

  /**
   * Execute one tick of the lifecycle state machine.
   * Returns true if the service should continue, false if it should shut down.
   */
  async tick(): Promise<boolean> {
    try {
      const gameState = await this.api.getState();
      if (!gameState) {
        this.logger.warn('Cannot read contract state');
        return this.handleError();
      }

      await this.processState(gameState);
      this.consecutiveErrors = 0;
      return true;
    } catch (e) {
      this.logger.error({ error: e, state: this.state }, 'Tick error');
      return this.handleError();
    }
  }

  private async processState(gameState: GameState): Promise<void> {
    const { roundStatus } = gameState;

    this.logger.debug({
      operatorState: this.state,
      roundStatus,
      roundNumber: Number(gameState.roundNumber),
      playerCount: Number(gameState.playerCount),
    }, 'Processing state');

    switch (roundStatus) {
      case RoundStatus.Resolved:
        await this.handleResolved(gameState);
        break;
      case RoundStatus.Open:
        this.state = OperatorState.OPEN;
        break;
      case RoundStatus.WaitingToResolve:
        await this.handleWaitingToResolve(gameState);
        break;
      case RoundStatus.Expired:
        await this.handleExpired(gameState);
        break;
    }
  }

  private async handleResolved(gameState: GameState): Promise<void> {
    // Clean up any leftover secrets from the previous round
    if (this.secretManager.has(gameState.roundNumber)) {
      this.secretManager.delete(gameState.roundNumber);
    }

    // Start a new round
    this.state = OperatorState.STARTING;
    this.logger.info('Starting new round');

    const secret = utils.generateSecret();
    const nextRoundNumber = gameState.roundNumber + 1n;
    const commitment = utils.createCommitment(this.api.pureCircuits, secret, nextRoundNumber);
    const roundEndTime = utils.computeRoundEndTime(gameState.config.roundDurationSecs);

    // Store secret first (crash recovery)
    this.secretManager.store(nextRoundNumber, secret);

    await this.api.startRound(commitment, roundEndTime);

    this.state = OperatorState.OPEN;
    this.logger.info(
      { roundNumber: Number(nextRoundNumber), roundEndTime: Number(roundEndTime) },
      'Round started',
    );
  }

  private async handleWaitingToResolve(gameState: GameState): Promise<void> {
    this.state = OperatorState.RESOLVING;
    this.logger.info(
      { roundNumber: Number(gameState.roundNumber), playerCount: Number(gameState.playerCount) },
      'Resolving round',
    );

    const secret = this.secretManager.get(gameState.roundNumber);
    if (!secret) {
      this.logger.error(
        { roundNumber: Number(gameState.roundNumber) },
        'No secret found for round — cannot resolve',
      );
      // Wait for deadline to expire so it can be cancelled
      this.state = OperatorState.WAITING_TO_RESOLVE;
      return;
    }

    const activeBets = gameState.bets.filter((b) => b.active);

    if (gameState.playerCount === 0n) {
      await this.api.resolveRound(
        secret,
        new Uint8Array(32),
        0n, 0n, 0n,
        false,
        new Uint8Array(32),
        0n, 0n, 0n, 0n, 0n, 0n,
      );
    } else if (gameState.playerCount === 1n) {
      await this.api.resolveRound(
        secret,
        activeBets[0].player,
        gameState.totalPot,
        0n, 0n,
        false,
        new Uint8Array(32),
        0n, 0n, 0n, 0n, 0n, 0n,
      );
    } else {
      const { houseFee, progressiveAmount, payout } = utils.computeFees(
        gameState.totalPot,
        gameState.config.houseFeeBps,
        gameState.config.progressiveBps,
      );

      const seed = utils.deriveSeed(
        this.api.pureCircuits,
        secret,
        gameState.roundNumber,
        gameState.totalPot,
      );
      const winner = utils.selectWeightedWinner(seed, activeBets, gameState.totalPot);

      const progSeed = utils.deriveProgressiveSeed(
        this.api.pureCircuits,
        seed,
        gameState.totalPot,
      );
      const jackpotTriggered = utils.isJackpotTriggered(
        progSeed,
        gameState.config.progressiveTrigger,
      );

      let jackpotWinner: Uint8Array = new Uint8Array(32);
      if (jackpotTriggered) {
        jackpotWinner = utils.selectProgressiveWinner(
          progSeed,
          gameState.playerCount,
          activeBets,
        );
        this.logger.info('JACKPOT TRIGGERED!');
      }

      // Compute verification params for on-chain modulo checks
      const vp = utils.computeVerificationParams(
        seed, gameState.totalPot, progSeed, gameState.config.progressiveTrigger, gameState.playerCount,
      );

      await this.api.resolveRound(
        secret,
        winner,
        payout,
        houseFee,
        progressiveAmount,
        jackpotTriggered,
        jackpotWinner,
        vp.rngTarget,
        vp.rngQuotient,
        vp.progRemainder,
        vp.progQuotient,
        vp.progWinnerIndex,
        vp.progWinnerQuotient,
      );

      this.logger.info({
        winner: Buffer.from(winner).toString('hex').slice(0, 16),
        payout: Number(payout),
        jackpotTriggered,
      }, 'Round resolved');
    }

    this.secretManager.delete(gameState.roundNumber);
    this.state = OperatorState.IDLE;
  }

  private async handleExpired(gameState: GameState): Promise<void> {
    // Resolve deadline has passed — cancel the round
    this.state = OperatorState.CANCELLING;
    this.logger.warn(
      { roundNumber: Number(gameState.roundNumber) },
      'Round expired — cancelling',
    );

    await this.api.cancelRound();

    this.secretManager.delete(gameState.roundNumber);
    this.state = OperatorState.IDLE;
    this.logger.info('Round cancelled');
  }

  private handleError(): boolean {
    this.consecutiveErrors++;
    if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
      this.logger.error(
        { consecutiveErrors: this.consecutiveErrors },
        'Max consecutive errors reached — shutting down',
      );
      return false;
    }
    return true;
  }
}
