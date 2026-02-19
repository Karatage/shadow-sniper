/**
 * Midnight SDK type parameterization for ShadowSniper contract.
 *
 * @module
 */

import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { Contract, Witnesses } from '@shadow-sniper/contract';

/**
 * Private state for ShadowSniper.
 * The operator secret key is the only private state needed.
 */
export interface ShadowSniperPrivateState {
  readonly operatorSecretKey: Uint8Array;
}

export const shadowSniperPrivateStateKey = 'shadowSniperPrivateState';
export type PrivateStateId = typeof shadowSniperPrivateStateKey;

/**
 * Private state schema consumed throughout the application.
 */
export type PrivateStates = {
  readonly [shadowSniperPrivateStateKey]: ShadowSniperPrivateState;
};

/**
 * Represents the ShadowSniper contract with its private state.
 */
export type ShadowSniperContract = Contract<
  ShadowSniperPrivateState,
  Witnesses<ShadowSniperPrivateState>
>;

/**
 * Circuit keys exported from the ShadowSniper contract.
 */
export type ShadowSniperCircuitKeys = Exclude<
  keyof ShadowSniperContract['impureCircuits'],
  number | symbol
>;

/**
 * Providers required by the ShadowSniper contract.
 */
export type ShadowSniperProviders = MidnightProviders<
  ShadowSniperCircuitKeys,
  PrivateStateId,
  ShadowSniperPrivateState
>;

/**
 * A deployed ShadowSniper contract instance.
 */
export type DeployedShadowSniperContract = FoundContract<ShadowSniperContract>;
