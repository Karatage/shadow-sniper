/**
 * Type definitions for ShadowSniper API
 */

export enum RoundState {
  RESOLVED = 'RESOLVED',
  OPEN = 'OPEN',
  RESOLVING = 'RESOLVING'
}

export interface RoundConfig {
  minBet: bigint;
  maxBet: bigint;
  roundDuration: bigint;
  houseFeePercent: bigint;
  progressivePercent: bigint;
  progressiveTriggerPercent: bigint;
  resolveDeadline: bigint;
}

export interface Bet {
  player: string;  // Address
  amount: bigint;
  timestamp: bigint;
}

export interface Round {
  roundNumber: bigint;
  state: RoundState;
  commitment: Uint8Array;
  startTime: bigint;
  endTime: bigint;
  resolveDeadline: bigint;
  totalPot: bigint;
  playerCount: bigint;
}

export interface RoundResult {
  roundNumber: bigint;
  winner: string;  // Address
  winnerBet: bigint;
  totalPot: bigint;
  payout: bigint;
  houseFee: bigint;
  progressiveContribution: bigint;
  progressiveWinner: string | null;  // Address or null
  progressivePayout: bigint;
  timestamp: bigint;
}

export interface GameState {
  operator: string;  // Address
  config: RoundConfig;
  currentRound: Round;
  bets: Bet[];
  progressivePool: bigint;
  houseBalance: bigint;
  totalRounds: bigint;
  lastResult: RoundResult | null;
}

export interface DeploymentConfig {
  operatorAddress: string;
  minBet?: bigint;
  maxBet?: bigint;
  roundDuration?: bigint;
  houseFeePercent?: bigint;
  progressivePercent?: bigint;
  progressiveTriggerPercent?: bigint;
  resolveDeadline?: bigint;
}

export interface ContractDeployment {
  contractAddress: string;
  transactionHash: string;
  blockNumber: bigint;
}

export interface TransactionResult {
  success: boolean;
  transactionHash: string;
  error?: string;
}
