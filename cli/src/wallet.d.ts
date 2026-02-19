/**
 * Wallet build and fund helpers for ShadowSniper CLI.
 * Adapted from Midnight's counter/bboard examples.
 *
 * @module
 */
import { DustSecretKey, ZswapSecretKeys } from '@midnight-ntwrk/ledger-v7';
import { type WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import type { UnshieldedWallet } from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { type Logger } from 'pino';
import type { NetworkConfig } from './config.js';
export interface WalletInfo {
    readonly wallet: WalletFacade;
    readonly zswapSecretKeys: ZswapSecretKeys;
    readonly dustSecretKey: DustSecretKey;
    readonly masterSeed: string;
}
/**
 * Build a wallet from a seed (or generate a random one).
 */
export declare function buildWallet(logger: Logger, config: NetworkConfig, seed?: string): Promise<WalletInfo>;
/**
 * Start a wallet and wait for it to sync.
 */
export declare function startAndSyncWallet(logger: Logger, walletInfo: WalletInfo, timeout?: number): Promise<void>;
/**
 * Get the wallet's initial unshielded state.
 */
export declare function getInitialState(wallet: ShieldedWallet | UnshieldedWallet): Promise<unknown>;
//# sourceMappingURL=wallet.d.ts.map