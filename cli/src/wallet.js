/**
 * Wallet build and fund helpers for ShadowSniper CLI.
 * Adapted from Midnight's counter/bboard examples.
 *
 * @module
 */
import { DustSecretKey, LedgerParameters, ZswapSecretKeys, } from '@midnight-ntwrk/ledger-v7';
import * as Rx from 'rxjs';
import { FluentWalletBuilder } from '@midnight-ntwrk/testkit-js';
import { NetworkId } from '@midnight-ntwrk/wallet-sdk-abstractions';
/**
 * Build a wallet from a seed (or generate a random one).
 */
export async function buildWallet(logger, config, seed) {
    const DEFAULT_DUST_OPTIONS = {
        ledgerParams: LedgerParameters.initialParameters(),
        additionalFeeOverhead: 1000n,
        feeBlocksMargin: 5,
    };
    const dustOptions = { ...DEFAULT_DUST_OPTIONS };
    if (config.networkId === NetworkId.NetworkId.Undeployed) {
        dustOptions.additionalFeeOverhead = 500000000000000000n;
    }
    const envConfig = {
        walletNetworkId: config.networkId,
        networkId: config.networkId,
        indexer: config.indexer,
        indexerWS: config.indexerWS,
        node: config.node,
        nodeWS: config.node.replace('http', 'ws'),
        proofServer: config.proofServer,
    };
    const builder = FluentWalletBuilder.forEnvironment(envConfig).withDustOptions(dustOptions);
    const buildResult = seed
        ? await builder.withSeed(seed).buildWithoutStarting()
        : await builder.withRandomSeed().buildWithoutStarting();
    const { wallet, seeds } = buildResult;
    const initialState = await Rx.firstValueFrom(wallet.shielded.state);
    logger.info(`Wallet address: ${initialState.address.coinPublicKeyString()}`);
    return {
        wallet,
        zswapSecretKeys: ZswapSecretKeys.fromSeed(seeds.shielded),
        dustSecretKey: DustSecretKey.fromSeed(seeds.dust),
        masterSeed: seeds.masterSeed,
    };
}
/**
 * Start a wallet and wait for it to sync.
 */
export async function startAndSyncWallet(logger, walletInfo, timeout = 90_000) {
    logger.info('Starting wallet...');
    await walletInfo.wallet.start(walletInfo.zswapSecretKeys, walletInfo.dustSecretKey);
    logger.info('Syncing wallet...');
    const isProgressComplete = (progress) => {
        if (!progress || typeof progress !== 'object')
            return false;
        const candidate = progress;
        return typeof candidate.isStrictlyComplete === 'function' && candidate.isStrictlyComplete();
    };
    await Rx.firstValueFrom(walletInfo.wallet.state().pipe(Rx.throttleTime(2_000), Rx.filter((state) => isProgressComplete(state.shielded.state.progress) &&
        isProgressComplete(state.dust.state.progress) &&
        isProgressComplete(state.unshielded.progress)), Rx.tap(() => logger.info('Wallet sync complete')), Rx.timeout({
        each: timeout,
        with: () => Rx.throwError(() => new Error(`Wallet sync timeout after ${timeout}ms`)),
    })));
}
/**
 * Get the wallet's initial unshielded state.
 */
export async function getInitialState(wallet) {
    return Rx.firstValueFrom(wallet.state);
}
//# sourceMappingURL=wallet.js.map