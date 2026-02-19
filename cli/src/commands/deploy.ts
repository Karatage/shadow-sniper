/**
 * Deploy command — deploys a new ShadowSniper contract.
 *
 * @module
 */

import { Command } from 'commander';
import { ShadowSniperAPI, utils } from '@shadow-sniper/api';
import { type Logger } from 'pino';
import { type ShadowSniperProviders } from '@shadow-sniper/api';

export function deployCommand(getProviders: () => Promise<ShadowSniperProviders>, logger: Logger): Command {
  return new Command('deploy')
    .description('Deploy a new ShadowSniper contract')
    .option('--min-bet <amount>', 'Minimum bet amount', '100')
    .option('--max-bet <amount>', 'Maximum bet amount', '10000')
    .option('--duration <seconds>', 'Round duration in seconds', '300')
    .option('--house-fee <bps>', 'House fee in basis points (300 = 3%)', '300')
    .option('--progressive <bps>', 'Progressive contribution in basis points', '100')
    .option('--trigger <denominator>', 'Progressive trigger denominator', '100')
    .option('--deadline <seconds>', 'Resolve deadline in seconds', '300')
    .action(async (opts) => {
      const providers = await getProviders();

      // Generate operator key from wallet
      const operatorSecret = utils.generateSecret();
      const operatorPubKey = new Uint8Array(32); // Will be derived from wallet's public key

      logger.info('Deploying ShadowSniper contract...');

      const api = await ShadowSniperAPI.deploy(
        providers,
        operatorPubKey,
        {
          minBet: BigInt(opts.minBet),
          maxBet: BigInt(opts.maxBet),
          roundDurationSecs: BigInt(opts.duration),
          houseFeeBps: BigInt(opts.houseFee),
          progressiveBps: BigInt(opts.progressive),
          progressiveTrigger: BigInt(opts.trigger),
          resolveDeadlineSecs: BigInt(opts.deadline),
        },
        logger,
      );

      console.log(`Contract deployed at: ${api.contractAddress}`);
      console.log('Save this address — you need it for all other commands.');
    });
}
