/**
 * ShadowSniper Operator Service — automated round lifecycle management.
 *
 * Polls the contract state every ~6s and manages round transitions:
 * start → open → resolve → start (continuous loop).
 *
 * @module
 */

import { WebSocket } from 'ws';
import pino from 'pino';
import { ShadowSniperAPI } from '@shadow-sniper/api';
import { loadConfig } from './config.js';
import { SecretManager } from './secret-manager.js';
import { LifecycleManager } from './lifecycle.js';
import { startHealthServer } from './health.js';

// Enable WebSocket for apollo-based indexer client
// @ts-expect-error: Required for WebSocket usage through apollo
globalThis.WebSocket = WebSocket;

async function main(): Promise<void> {
  const config = loadConfig();

  const logger = pino({
    level: config.logLevel,
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  });

  logger.info({ config: { ...config, walletSeed: '***' } }, 'Starting operator service');

  // Import CLI utilities for wallet and provider setup
  // The operator reuses the same wallet/provider infrastructure as the CLI
  const { getNetworkConfig } = await import('@shadow-sniper/cli/config');
  const { buildWallet, startAndSyncWallet } = await import('@shadow-sniper/cli/wallet');
  const { buildProviders } = await import('@shadow-sniper/cli/providers');

  const networkConfig = getNetworkConfig(config.network);
  const walletInfo = await buildWallet(logger, networkConfig, config.walletSeed);
  await startAndSyncWallet(logger, walletInfo);
  const providers = buildProviders(networkConfig, walletInfo, logger);

  // Connect to existing contract
  const api = await ShadowSniperAPI.connect(providers, config.contractAddress, logger);
  logger.info({ contractAddress: config.contractAddress }, 'Connected to contract');

  // Initialize secret manager and lifecycle
  const secretManager = new SecretManager(config.secretStorePath, logger);
  const lifecycle = new LifecycleManager(
    api,
    secretManager,
    logger,
    config.maxConsecutiveErrors,
  );

  // Start health endpoint
  const healthServer = startHealthServer(config.healthPort, lifecycle, logger);

  // Main polling loop
  logger.info({ pollIntervalMs: config.pollIntervalMs }, 'Entering main loop');

  let running = true;

  const shutdown = () => {
    logger.info('Shutdown signal received');
    running = false;
    healthServer.close();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  while (running) {
    const shouldContinue = await lifecycle.tick();
    if (!shouldContinue) {
      logger.error('Lifecycle manager requested shutdown');
      break;
    }

    await sleep(config.pollIntervalMs);
  }

  logger.info('Operator service stopped');
  process.exit(0);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
