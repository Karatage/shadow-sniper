/**
 * Operator service configuration.
 *
 * @module
 */

export interface OperatorConfig {
  /** Contract address to operate */
  readonly contractAddress: string;

  /** Network to connect to */
  readonly network: 'standalone' | 'preview' | 'preprod';

  /** Wallet seed (hex) for the operator */
  readonly walletSeed: string;

  /** Polling interval in milliseconds */
  readonly pollIntervalMs: number;

  /** Maximum consecutive errors before shutdown */
  readonly maxConsecutiveErrors: number;

  /** Health check HTTP port */
  readonly healthPort: number;

  /** Log level */
  readonly logLevel: string;

  /** Path to persist secrets for crash recovery */
  readonly secretStorePath: string;
}

export function loadConfig(): OperatorConfig {
  return {
    contractAddress: requireEnv('CONTRACT_ADDRESS'),
    network: (process.env.NETWORK || 'standalone') as OperatorConfig['network'],
    walletSeed: requireEnv('WALLET_SEED'),
    pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '6000', 10),
    maxConsecutiveErrors: parseInt(process.env.MAX_CONSECUTIVE_ERRORS || '10', 10),
    healthPort: parseInt(process.env.HEALTH_PORT || '8080', 10),
    logLevel: process.env.LOG_LEVEL || 'info',
    secretStorePath: process.env.SECRET_STORE_PATH || '/tmp/shadow-sniper-operator-secrets.json',
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
