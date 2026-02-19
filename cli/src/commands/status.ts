/**
 * Status command — display game state.
 *
 * @module
 */

import { Command } from 'commander';
import { ShadowSniperAPI } from '@shadow-sniper/api';
import { type Logger } from 'pino';
import { displayStatus } from '../display.js';

export function statusCommand(
  getApi: () => Promise<ShadowSniperAPI>,
  _logger: Logger,
): Command {
  return new Command('status')
    .description('Display current game state')
    .action(async () => {
      const api = await getApi();
      const state = await api.getState();

      if (!state) {
        console.error('Cannot read contract state. Is the contract deployed?');
        return;
      }

      console.log(displayStatus(state));
    });
}
