/**
 * Provider configuration for ShadowSniper CLI.
 *
 * @module
 */

import {
  type CoinPublicKey,
  type EncPublicKey,
  type FinalizedTransaction,
  type DustSecretKey,
  type ZswapSecretKeys,
} from '@midnight-ntwrk/ledger-v7';
import {
  type MidnightProvider,
  UnboundTransaction,
  type WalletProvider,
} from '@midnight-ntwrk/midnight-js-types';
import { ttlOneHour } from '@midnight-ntwrk/midnight-js-utils';
import { type WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { type Logger } from 'pino';
import {
  type ShadowSniperProviders,
  type ShadowSniperCircuitKeys,
  type ShadowSniperPrivateState,
  type PrivateStateId,
} from '@shadow-sniper/api';
import type { NetworkConfig } from './config.js';
import type { WalletInfo } from './wallet.js';

/**
 * Wallet provider that implements both MidnightProvider and WalletProvider interfaces.
 */
export class ShadowSniperWalletProvider implements MidnightProvider, WalletProvider {
  private constructor(
    private readonly wallet: WalletFacade,
    private readonly zswapSecretKeys: ZswapSecretKeys,
    private readonly dustSecretKey: DustSecretKey,
  ) {}

  getCoinPublicKey(): CoinPublicKey {
    return this.zswapSecretKeys.coinPublicKey;
  }

  getEncryptionPublicKey(): EncPublicKey {
    return this.zswapSecretKeys.encryptionPublicKey;
  }

  async balanceTx(tx: UnboundTransaction, ttl: Date = ttlOneHour()): Promise<FinalizedTransaction> {
    const recipe = await this.wallet.balanceUnboundTransaction(
      tx,
      { shieldedSecretKeys: this.zswapSecretKeys, dustSecretKey: this.dustSecretKey },
      { ttl },
    );
    return this.wallet.finalizeRecipe(recipe);
  }

  submitTx(tx: FinalizedTransaction): Promise<string> {
    return this.wallet.submitTransaction(tx);
  }

  static create(walletInfo: WalletInfo): ShadowSniperWalletProvider {
    return new ShadowSniperWalletProvider(
      walletInfo.wallet,
      walletInfo.zswapSecretKeys,
      walletInfo.dustSecretKey,
    );
  }
}

/**
 * Build all providers needed for the ShadowSniper contract.
 */
export function buildProviders(
  config: NetworkConfig,
  walletInfo: WalletInfo,
  _logger: Logger,
): ShadowSniperProviders {
  const walletProvider = ShadowSniperWalletProvider.create(walletInfo);
  const zkConfigProvider = new NodeZkConfigProvider<ShadowSniperCircuitKeys>(config.zkConfigPath);

  return {
    privateStateProvider: levelPrivateStateProvider<PrivateStateId, ShadowSniperPrivateState>({
      privateStateStoreName: config.privateStateStoreName,
      signingKeyStoreName: `${config.privateStateStoreName}-signing-keys`,
      privateStoragePasswordProvider: () => 'shadow-sniper-dev-key',
    }),
    publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(config.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };
}
