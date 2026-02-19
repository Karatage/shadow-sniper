/**
 * Provider configuration for ShadowSniper CLI.
 *
 * @module
 */
import { ttlOneHour } from '@midnight-ntwrk/midnight-js-utils';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
/**
 * Wallet provider that implements both MidnightProvider and WalletProvider interfaces.
 */
export class ShadowSniperWalletProvider {
    wallet;
    zswapSecretKeys;
    dustSecretKey;
    constructor(wallet, zswapSecretKeys, dustSecretKey) {
        this.wallet = wallet;
        this.zswapSecretKeys = zswapSecretKeys;
        this.dustSecretKey = dustSecretKey;
    }
    getCoinPublicKey() {
        return this.zswapSecretKeys.coinPublicKey;
    }
    getEncryptionPublicKey() {
        return this.zswapSecretKeys.encryptionPublicKey;
    }
    async balanceTx(tx, ttl = ttlOneHour()) {
        const recipe = await this.wallet.balanceUnboundTransaction(tx, { shieldedSecretKeys: this.zswapSecretKeys, dustSecretKey: this.dustSecretKey }, { ttl });
        return this.wallet.finalizeRecipe(recipe);
    }
    submitTx(tx) {
        return this.wallet.submitTransaction(tx);
    }
    static create(walletInfo) {
        return new ShadowSniperWalletProvider(walletInfo.wallet, walletInfo.zswapSecretKeys, walletInfo.dustSecretKey);
    }
}
/**
 * Build all providers needed for the ShadowSniper contract.
 */
export function buildProviders(config, walletInfo, _logger) {
    const walletProvider = ShadowSniperWalletProvider.create(walletInfo);
    const zkConfigProvider = new NodeZkConfigProvider(config.zkConfigPath);
    return {
        privateStateProvider: levelPrivateStateProvider({
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
//# sourceMappingURL=providers.js.map