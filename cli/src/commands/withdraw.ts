/**
 * Withdraw command — withdraw accumulated house fees.
 *
 * @module
 */

import { Command } from 'commander';
import { ShadowSniperAPI } from '@shadow-sniper/api';
import { type Logger } from 'pino';

export function withdrawCommand(
  getApi: () => Promise<ShadowSniperAPI>,
  logger: Logger,
): Command {
  return new Command('withdraw')
    .description('Withdraw house fees (operator only)')
    .argument('<amount>', 'Amount to withdraw in tDUST')
    .action(async (amountStr: string) => {
      const amount = BigInt(amountStr);
      const api = await getApi();
      const state = await api.getState();

      if (!state) {
        console.error('Cannot read contract state');
        return;
      }

      if (amount > state.houseBalance) {
        console.error(
          `Insufficient balance: requested ${amount}, available ${state.houseBalance} tDUST`,
        );
        return;
      }

      logger.info({ amount: Number(amount) }, 'Withdrawing house fees');
      const result = await api.withdrawHouseFees(amount);
      console.log(`Withdrawn ${amount} tDUST`);
      console.log(`  Remaining balance: ${state.houseBalance - amount} tDUST`);
      console.log(`  TX: ${result.txHash}`);
    });
}
