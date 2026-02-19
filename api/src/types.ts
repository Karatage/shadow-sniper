/**
 * Game domain types for ShadowSniper.
 *
 * @module
 */

/** Round lifecycle states */
export enum RoundStatus {
  /** No active round, operator can start one */
  Resolved = 'resolved',
  /** Betting is active, players can place bets */
  Open = 'open',
  /** Betting closed, waiting for operator to resolve */
  WaitingToResolve = 'waiting_to_resolve',
  /** Resolve deadline has passed, round can be cancelled */
  Expired = 'expired',
}

/** A player's bet in a round */
export interface Bet {
  readonly active: boolean;
  readonly player: Uint8Array;
  readonly amount: bigint;
}

/** Game configuration parameters */
export interface GameConfig {
  readonly operator: Uint8Array;
  readonly minBet: bigint;
  readonly maxBet: bigint;
  readonly roundDurationSecs: bigint;
  readonly houseFeeBps: bigint;
  readonly progressiveBps: bigint;
  readonly progressiveTrigger: bigint;
  readonly resolveDeadlineSecs: bigint;
}

/** Results from the last completed round */
export interface RoundResult {
  readonly winner: Uint8Array;
  readonly payout: bigint;
  readonly jackpotWinner: Uint8Array;
  readonly jackpotAmount: bigint;
}

/** Complete game state derived from on-chain ledger */
export interface GameState {
  readonly config: GameConfig;
  readonly roundStatus: RoundStatus;
  readonly roundNumber: bigint;
  readonly commitment: Uint8Array;
  readonly roundEndTime: bigint;
  readonly roundDeadline: bigint;
  readonly playerCount: bigint;
  readonly totalPot: bigint;
  readonly bets: readonly Bet[];
  readonly progressivePool: bigint;
  readonly houseBalance: bigint;
  readonly lastResult: RoundResult;
  readonly totalRoundsPlayed: bigint;
}

/** Transaction result from a circuit call */
export interface TxResult {
  readonly txHash: string;
  readonly blockHeight: number;
}
