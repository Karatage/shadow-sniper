/**
 * Bet command — place a bet in the current round.
 *
 * @module
 */

import { Command } from 'commander';
import { ShadowSniperAPI, RoundStatus } from '@shadow-sniper/api';
import { type Logger } from 'pino';

export function betCommand(
  getApi: () => Promise<ShadowSniperAPI>,
  logger: Logger,
): Command {
  return new Command('bet')
    .description('Place a bet in the current round')
    .argument('<amount>', 'Bet amount in tDUST')
    .action(async (amountStr: string) => {
      const amount = BigInt(amountStr);
      const api = await getApi();
      const state = await api.getState();

      if (!state) {
        console.error('Cannot read contract state');
        return;
      }

      if (state.roundStatus !== RoundStatus.Open) {
        console.error(`Cannot bet — round status: ${state.roundStatus}`);
        return;
      }

      if (amount < state.config.minBet) {
        console.error(`Bet too low — minimum is ${state.config.minBet} tDUST`);
        return;
      }

      if (amount > state.config.maxBet) {
        console.error(`Bet too high — maximum is ${state.config.maxBet} tDUST`);
        return;
      }

      if (state.playerCount >= 10n) {
        console.error('Round is full (max 10 players)');
        return;
      }

      logger.info({ amount: Number(amount) }, 'Placing bet');
      const result = await api.placeBet(amount);
      console.log(`Bet placed: ${amount} tDUST`);
      console.log(`  TX: ${result.txHash}`);
    });
}
