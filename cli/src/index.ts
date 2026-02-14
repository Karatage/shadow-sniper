#!/usr/bin/env node

/**
 * ShadowSniper CLI
 *
 * Command-line interface for interacting with the ShadowSniper game
 */

import { Command } from 'commander';
import { deployCommand } from './commands/deploy.js';
import { startRoundCommand } from './commands/start-round.js';
import { betCommand } from './commands/bet.js';
import { statusCommand } from './commands/status.js';
import { resolveCommand } from './commands/resolve.js';
import { cancelCommand } from './commands/cancel.js';

const program = new Command();

program
  .name('shadow-sniper')
  .description('ShadowSniper - PvP betting game on Midnight Network')
  .version('0.1.0');

// Deploy command
program
  .command('deploy')
  .description('Deploy a new ShadowSniper contract')
  .requiredOption('--operator <address>', 'Operator wallet address')
  .option('--min-bet <amount>', 'Minimum bet in NIGHT tokens (default: 100)')
  .option('--max-bet <amount>', 'Maximum bet in NIGHT tokens (default: 10000)')
  .option('--round-duration <ms>', 'Round duration in milliseconds (default: 300000)')
  .option('--house-fee <percent>', 'House fee percentage (default: 3)')
  .option('--progressive <percent>', 'Progressive contribution percentage (default: 1)')
  .option('--progressive-trigger <percent>', 'Progressive trigger probability (default: 1)')
  .option('--resolve-deadline <ms>', 'Time for operator to resolve in ms (default: 300000)')
  .action(async (options) => {
    await deployCommand({
      operator: options.operator,
      minBet: options.minBet,
      maxBet: options.maxBet,
      roundDuration: options.roundDuration,
      houseFee: options.houseFee,
      progressive: options.progressive,
      progressiveTrigger: options.progressiveTrigger,
      resolveDeadline: options.resolveDeadline
    });
  });

// Start round command
program
  .command('start-round')
  .description('Start a new round (operator only)')
  .requiredOption('--contract <address>', 'Contract address')
  .option('--secret <hex>', 'Pre-generated 32-byte secret (hex)')
  .action(async (options) => {
    await startRoundCommand({
      contract: options.contract,
      secret: options.secret
    });
  });

// Bet command
program
  .command('bet')
  .description('Place a bet in the current round')
  .requiredOption('--contract <address>', 'Contract address')
  .requiredOption('--amount <amount>', 'Bet amount in NIGHT tokens')
  .action(async (options) => {
    await betCommand({
      contract: options.contract,
      amount: options.amount
    });
  });

// Status command
program
  .command('status')
  .description('Show current game status')
  .requiredOption('--contract <address>', 'Contract address')
  .action(async (options) => {
    await statusCommand({
      contract: options.contract
    });
  });

// Resolve command
program
  .command('resolve')
  .description('Resolve the round by revealing secret (operator only)')
  .requiredOption('--contract <address>', 'Contract address')
  .requiredOption('--secret <hex>', 'The secret used in start-round (32 bytes hex)')
  .action(async (options) => {
    await resolveCommand({
      contract: options.contract,
      secret: options.secret
    });
  });

// Cancel command
program
  .command('cancel')
  .description('Cancel round after timeout and refund all bets')
  .requiredOption('--contract <address>', 'Contract address')
  .action(async (options) => {
    await cancelCommand({
      contract: options.contract
    });
  });

program.parse();
