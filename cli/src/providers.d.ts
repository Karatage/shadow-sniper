/**
 * Provider configuration for ShadowSniper CLI.
 *
 * @module
 */
import { type CoinPublicKey, type EncPublicKey, type FinalizedTransaction } from '@midnight-ntwrk/ledger-v7';
import { type MidnightProvider, UnboundTransaction, type WalletProvider } from '@midnight-ntwrk/midnight-js-types';
import { type Logger } from 'pino';
import { type ShadowSniperProviders } from '@shadow-sniper/api';
import type { NetworkConfig } from './config.js';
import type { WalletInfo } from './wallet.js';
/**
 * Wallet provider that implements both MidnightProvider and WalletProvider interfaces.
 */
export declare class ShadowSniperWalletProvider implements MidnightProvider, WalletProvider {
    private readonly wallet;
    private readonly zswapSecretKeys;
    private readonly dustSecretKey;
    private constructor();
    getCoinPublicKey(): CoinPublicKey;
    getEncryptionPublicKey(): EncPublicKey;
    balanceTx(tx: UnboundTransaction, ttl?: Date): Promise<FinalizedTransaction>;
    submitTx(tx: FinalizedTransaction): Promise<string>;
    static create(walletInfo: WalletInfo): ShadowSniperWalletProvider;
}
/**
 * Build all providers needed for the ShadowSniper contract.
 */
export declare function buildProviders(config: NetworkConfig, walletInfo: WalletInfo, _logger: Logger): ShadowSniperProviders;
//# sourceMappingURL=providers.d.ts.map