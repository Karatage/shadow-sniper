/**
 * Network configurations for ShadowSniper CLI.
 *
 * @module
 */
export interface NetworkConfig {
    readonly networkId: string;
    readonly indexer: string;
    readonly indexerWS: string;
    readonly node: string;
    readonly proofServer: string;
    readonly zkConfigPath: string;
    readonly privateStateStoreName: string;
}
export declare const STANDALONE_CONFIG: NetworkConfig;
export declare const PREVIEW_CONFIG: NetworkConfig;
export declare const PREPROD_CONFIG: NetworkConfig;
export declare function getNetworkConfig(network: string): NetworkConfig;
/** Genesis mint wallet seed — only for standalone (dev) mode */
export declare const GENESIS_MINT_WALLET_SEED = "0000000000000000000000000000000000000000000000000000000000000001";
//# sourceMappingURL=config.d.ts.map