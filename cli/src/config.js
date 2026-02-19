/**
 * Network configurations for ShadowSniper CLI.
 *
 * @module
 */
import path from 'node:path';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
const currentDir = path.resolve(new URL(import.meta.url).pathname, '..');
const zkConfigPath = path.resolve(currentDir, '..', '..', 'contract', 'src', 'managed', 'shadow_sniper');
export const STANDALONE_CONFIG = {
    networkId: 'undeployed',
    indexer: 'http://localhost:8088/api/v3/graphql',
    indexerWS: 'ws://localhost:8088/api/v3/graphql/ws',
    node: 'http://localhost:9944',
    proofServer: 'http://localhost:6300',
    zkConfigPath,
    privateStateStoreName: 'shadow-sniper-private-state',
};
export const PREVIEW_CONFIG = {
    networkId: 'preview',
    indexer: 'https://indexer.preview.midnight.network/api/v3/graphql',
    indexerWS: 'wss://indexer.preview.midnight.network/api/v3/graphql/ws',
    node: 'https://rpc.preview.midnight.network',
    proofServer: 'http://localhost:6300',
    zkConfigPath,
    privateStateStoreName: 'shadow-sniper-private-state-preview',
};
export const PREPROD_CONFIG = {
    networkId: 'preprod',
    indexer: 'https://indexer.preprod.midnight.network/api/v3/graphql',
    indexerWS: 'wss://indexer.preprod.midnight.network/api/v3/graphql/ws',
    node: 'https://rpc.preprod.midnight.network',
    proofServer: 'http://localhost:6300',
    zkConfigPath,
    privateStateStoreName: 'shadow-sniper-private-state-preprod',
};
export function getNetworkConfig(network) {
    switch (network) {
        case 'standalone':
            return STANDALONE_CONFIG;
        case 'preview':
            setNetworkId('preview');
            return PREVIEW_CONFIG;
        case 'preprod':
            setNetworkId('preprod');
            return PREPROD_CONFIG;
        default:
            throw new Error(`Unknown network: ${network}. Use standalone, preview, or preprod.`);
    }
}
/** Genesis mint wallet seed — only for standalone (dev) mode */
export const GENESIS_MINT_WALLET_SEED = '0000000000000000000000000000000000000000000000000000000000000001';
//# sourceMappingURL=config.js.map