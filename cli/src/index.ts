#!/usr/bin/env node

/**
 * ShadowSniper CLI — command-line tool for the ShadowSniper PvP betting game.
 *
 * @module
 */

import { Command } from 'commander';
import { WebSocket } from 'ws';
import pino from 'pino';
import { ShadowSniperAPI, type ShadowSniperProviders } from '@shadow-sniper/api';
import { getNetworkConfig, GENESIS_MINT_WALLET_SEED, type NetworkConfig } from './config.js';
import { buildWallet, startAndSyncWallet, type WalletInfo } from './wallet.js';
import { buildProviders } from './providers.js';
import { deployCommand } from './commands/deploy.js';
import { startRoundCommand, resolveCommand, cancelCommand } from './commands/round.js';
import { betCommand } from './commands/bet.js';
import { statusCommand } from './commands/status.js';
import { configCommand } from './commands/config-cmd.js';
import { withdrawCommand } from './commands/withdraw.js';

// Enable WebSocket for apollo-based indexer client
// @ts-expect-error: Required for WebSocket usage through apollo
globalThis.WebSocket = WebSocket;

const program = new Command();

program
  .name('shadow-sniper')
  .description('ShadowSniper — PvP betting game on Midnight Network')
  .version('0.1.0')
  .option('-n, --network <network>', 'Network to connect to (standalone, preview, preprod)', 'standalone')
  .option('-s, --seed <seed>', 'Wallet seed (hex). Uses genesis mint seed for standalone if not provided.')
  .option('-c, --contract <address>', 'Contract address to connect to')
  .option('-l, --log-level <level>', 'Log level (trace, debug, info, warn, error)', 'info');

let walletInfo: WalletInfo | undefined;
let providers: ShadowSniperProviders | undefined;
let cachedApi: ShadowSniperAPI | undefined;

function getLogger(): pino.Logger {
  const opts = program.opts();
  return pino({ level: opts.logLevel || 'info' });
}

async function getProviders(): Promise<ShadowSniperProviders> {
  if (providers) return providers;

  const opts = program.opts();
  const logger = getLogger();
  const config: NetworkConfig = getNetworkConfig(opts.network);

  const seed = opts.seed || (opts.network === 'standalone' ? GENESIS_MINT_WALLET_SEED : undefined);
  if (!seed) {
    throw new Error('Wallet seed required for non-standalone networks. Use --seed <hex>');
  }

  walletInfo = await buildWallet(logger, config, seed);
  await startAndSyncWallet(logger, walletInfo);
  providers = buildProviders(config, walletInfo, logger);
  return providers;
}

async function getApi(): Promise<ShadowSniperAPI> {
  if (cachedApi) return cachedApi;

  const opts = program.opts();
  if (!opts.contract) {
    throw new Error('Contract address required. Use --contract <address> or deploy first.');
  }

  const p = await getProviders();
  const logger = getLogger();
  cachedApi = await ShadowSniperAPI.connect(p, opts.contract, logger);
  return cachedApi;
}

const logger = getLogger();

// Register commands
program.addCommand(deployCommand(getProviders, logger));
program.addCommand(startRoundCommand(getApi, logger));
program.addCommand(resolveCommand(getApi, logger));
program.addCommand(cancelCommand(getApi, logger));
program.addCommand(betCommand(getApi, logger));
program.addCommand(statusCommand(getApi, logger));
program.addCommand(configCommand(getApi, logger));
program.addCommand(withdrawCommand(getApi, logger));

program.parseAsync(process.argv).catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
