/**
 * Error hierarchy for ShadowSniper operations.
 *
 * @module
 */

/** Base error for all ShadowSniper operations */
export class ShadowSniperError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShadowSniperError';
  }
}

/** Caller is not the operator */
export class NotOperatorError extends ShadowSniperError {
  constructor() {
    super('Only the operator can perform this action');
    this.name = 'NotOperatorError';
  }
}

/** Round is not in the expected state */
export class RoundNotOpenError extends ShadowSniperError {
  constructor() {
    super('Round is not open for betting');
    this.name = 'RoundNotOpenError';
  }
}

/** Round is still active, cannot start a new one */
export class RoundAlreadyActiveError extends ShadowSniperError {
  constructor() {
    super('A round is already active');
    this.name = 'RoundAlreadyActiveError';
  }
}

/** Bet amount is outside allowed range */
export class BetOutOfRangeError extends ShadowSniperError {
  constructor(amount: bigint, min: bigint, max: bigint) {
    super(`Bet ${amount} is outside range [${min}, ${max}]`);
    this.name = 'BetOutOfRangeError';
  }
}

/** Player has already placed a bet this round */
export class DuplicateBetError extends ShadowSniperError {
  constructor() {
    super('Player has already placed a bet this round');
    this.name = 'DuplicateBetError';
  }
}

/** Round is full (max 10 players) */
export class RoundFullError extends ShadowSniperError {
  constructor() {
    super('Round is full (maximum 10 players)');
    this.name = 'RoundFullError';
  }
}

/** Round has not ended yet */
export class RoundNotEndedError extends ShadowSniperError {
  constructor() {
    super('Round has not ended yet');
    this.name = 'RoundNotEndedError';
  }
}

/** Resolve deadline has not expired yet */
export class DeadlineNotExpiredError extends ShadowSniperError {
  constructor() {
    super('Resolve deadline has not expired yet');
    this.name = 'DeadlineNotExpiredError';
  }
}

/** Invalid secret — does not match commitment */
export class InvalidSecretError extends ShadowSniperError {
  constructor() {
    super('Secret does not match the commitment');
    this.name = 'InvalidSecretError';
  }
}

/** Insufficient house balance for withdrawal */
export class InsufficientBalanceError extends ShadowSniperError {
  constructor(requested: bigint, available: bigint) {
    super(`Insufficient balance: requested ${requested}, available ${available}`);
    this.name = 'InsufficientBalanceError';
  }
}

/** Transaction failed to submit or was rejected */
export class TransactionError extends ShadowSniperError {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'TransactionError';
  }
}

/** Contract deployment failed */
export class DeploymentError extends ShadowSniperError {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'DeploymentError';
  }
}
