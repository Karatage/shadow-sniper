/**
 * ShadowSniper API Entry Point
 *
 * Exports all public APIs, types, and utilities
 */

export { ShadowSniperAPI } from './shadow-sniper-api.js';

export {
  RoundState,
  type RoundConfig,
  type Bet,
  type Round,
  type RoundResult,
  type GameState,
  type DeploymentConfig,
  type ContractDeployment,
  type TransactionResult
} from './types.js';

export {
  generateSecret,
  createCommitment,
  verifyCommitment,
  deriveSecret,
  bytesToHex,
  hexToBytes
} from './utils/rng.js';

export {
  formatDuration,
  getTimeRemaining,
  isRoundOpen,
  isReadyToResolve,
  hasPassedDeadline,
  formatTimestamp,
  now,
  DEFAULT_ROUND_DURATION,
  DEFAULT_RESOLVE_DEADLINE
} from './utils/time.js';
