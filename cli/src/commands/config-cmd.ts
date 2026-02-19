/**
 * Config command — view or update game parameters.
 *
 * @module
 */

import { Command } from 'commander';
import { ShadowSniperAPI, RoundStatus, utils } from '@shadow-sniper/api';
const { formatDuration } = utils;
import { type Logger } from 'pino';

export function configCommand(
  getApi: () => Promise<ShadowSniperAPI>,
  logger: Logger,
): Command {
  const cmd = new Command('config')
    .description('View or update game configuration');

  cmd
    .command('show')
    .description('Show current configuration')
    .action(async () => {
      const api = await getApi();
      const state = await api.getState();
      if (!state) {
        console.error('Cannot read contract state');
        return;
      }

      const c = state.config;
      console.log('=== ShadowSniper Config ===');
      console.log(`  Min bet:         ${c.minBet} tDUST`);
      console.log(`  Max bet:         ${c.maxBet} tDUST`);
      console.log(`  Round duration:  ${formatDuration(c.roundDurationSecs)}`);
      console.log(`  House fee:       ${Number(c.houseFeeBps) / 100}% (${c.houseFeeBps} bps)`);
      console.log(`  Progressive:     ${Number(c.progressiveBps) / 100}% (${c.progressiveBps} bps)`);
      console.log(`  Trigger:         1 in ${c.progressiveTrigger}`);
      console.log(`  Resolve deadline: ${formatDuration(c.resolveDeadlineSecs)}`);
    });

  cmd
    .command('update')
    .description('Update configuration (operator only, between rounds)')
    .requiredOption('--min-bet <amount>', 'Minimum bet amount')
    .requiredOption('--max-bet <amount>', 'Maximum bet amount')
    .requiredOption('--duration <seconds>', 'Round duration in seconds')
    .requiredOption('--house-fee <bps>', 'House fee in basis points')
    .requiredOption('--progressive <bps>', 'Progressive contribution in basis points')
    .requiredOption('--trigger <denominator>', 'Progressive trigger denominator')
    .requiredOption('--deadline <seconds>', 'Resolve deadline in seconds')
    .action(async (opts) => {
      const api = await getApi();
      const state = await api.getState();
      if (!state) {
        console.error('Cannot read contract state');
        return;
      }

      if (state.roundStatus !== RoundStatus.Resolved) {
        console.error('Cannot update config during active round');
        return;
      }

      logger.info('Updating config');
      const result = await api.updateConfig(
        BigInt(opts.minBet),
        BigInt(opts.maxBet),
        BigInt(opts.duration),
        BigInt(opts.houseFee),
        BigInt(opts.progressive),
        BigInt(opts.trigger),
        BigInt(opts.deadline),
      );
      console.log(`Config updated. TX: ${result.txHash}`);
    });

  return cmd;
}
