/**
 * Round management commands — start-round, resolve, cancel.
 *
 * @module
 */

import { Command } from 'commander';
import { ShadowSniperAPI, utils, type GameState, RoundStatus } from '@shadow-sniper/api';
import { type Logger } from 'pino';
import { type ShadowSniperProviders } from '@shadow-sniper/api';
import { storeSecret, retrieveSecret, deleteSecret } from '../secret-store.js';

export function startRoundCommand(
  getApi: () => Promise<ShadowSniperAPI>,
  logger: Logger,
): Command {
  return new Command('start-round')
    .description('Start a new betting round (operator only)')
    .action(async () => {
      const api = await getApi();
      const state = await api.getState();
      if (!state) {
        console.error('Cannot read contract state');
        return;
      }

      if (state.roundStatus !== RoundStatus.Resolved) {
        console.error(`Cannot start round — current status: ${state.roundStatus}`);
        return;
      }

      // Generate secret and commitment
      const secret = utils.generateSecret();
      const roundNumber = state.roundNumber + 1n;
      const commitment = utils.createCommitment(api.pureCircuits, secret, roundNumber);

      // Compute round end time
      const roundEndTime = utils.computeRoundEndTime(state.config.roundDurationSecs);

      // Store secret for later reveal
      storeSecret(api.contractAddress, roundNumber, secret);

      logger.info({ roundNumber: Number(roundNumber) }, 'Starting round');

      const result = await api.startRound(commitment, roundEndTime);
      console.log(`Round #${roundNumber} started`);
      console.log(`  Ends at: ${new Date(Number(roundEndTime) * 1000).toISOString()}`);
      console.log(`  Duration: ${utils.formatDuration(state.config.roundDurationSecs)}`);
      console.log(`  TX: ${result.txHash}`);
    });
}

export function resolveCommand(
  getApi: () => Promise<ShadowSniperAPI>,
  logger: Logger,
): Command {
  return new Command('resolve')
    .description('Resolve the current round (operator only)')
    .action(async () => {
      const api = await getApi();
      const state = await api.getState();
      if (!state) {
        console.error('Cannot read contract state');
        return;
      }

      if (state.roundStatus !== RoundStatus.WaitingToResolve) {
        console.error(`Cannot resolve — current status: ${state.roundStatus}`);
        return;
      }

      // Retrieve stored secret
      const secret = retrieveSecret(api.contractAddress, state.roundNumber);
      if (!secret) {
        console.error(`No stored secret found for round #${state.roundNumber}`);
        return;
      }

      const activeBets = state.bets.filter((b) => b.active);

      if (state.playerCount === 0n) {
        // No players — empty resolve
        const result = await api.resolveRound(
          secret,
          new Uint8Array(32),
          0n, 0n, 0n,
          false,
          new Uint8Array(32),
          0n, 0n, 0n, 0n, 0n, 0n,
        );
        console.log(`Round #${state.roundNumber} resolved (no players)`);
        console.log(`  TX: ${result.txHash}`);
      } else if (state.playerCount === 1n) {
        // Single player — full refund
        const player = activeBets[0];
        const result = await api.resolveRound(
          secret,
          player.player,
          state.totalPot,
          0n, 0n,
          false,
          new Uint8Array(32),
          0n, 0n, 0n, 0n, 0n, 0n,
        );
        console.log(`Round #${state.roundNumber} resolved (single player refund)`);
        console.log(`  TX: ${result.txHash}`);
      } else {
        // 2+ players — normal resolution
        const { houseFee, progressiveAmount, payout } = utils.computeFees(
          state.totalPot,
          state.config.houseFeeBps,
          state.config.progressiveBps,
        );

        // Derive seed and select winner
        const seed = utils.deriveSeed(api.pureCircuits, secret, state.roundNumber, state.totalPot);
        const winner = utils.selectWeightedWinner(seed, activeBets, state.totalPot);

        // Check progressive
        const progSeed = utils.deriveProgressiveSeed(api.pureCircuits, seed, state.totalPot);
        const jackpotTriggered = utils.isJackpotTriggered(progSeed, state.config.progressiveTrigger);

        let jackpotWinner: Uint8Array = new Uint8Array(32);
        if (jackpotTriggered) {
          jackpotWinner = utils.selectProgressiveWinner(progSeed, state.playerCount, activeBets);
        }

        // Compute verification params for on-chain modulo checks
        const vp = utils.computeVerificationParams(
          seed, state.totalPot, progSeed, state.config.progressiveTrigger, state.playerCount,
        );

        const result = await api.resolveRound(
          secret,
          winner,
          payout,
          houseFee,
          progressiveAmount,
          jackpotTriggered,
          jackpotWinner,
          vp.rngTarget,
          vp.rngQuotient,
          vp.progRemainder,
          vp.progQuotient,
          vp.progWinnerIndex,
          vp.progWinnerQuotient,
        );

        console.log(`Round #${state.roundNumber} resolved`);
        console.log(`  Winner: ${Buffer.from(winner).toString('hex').slice(0, 16)}...`);
        console.log(`  Payout: ${payout} tDUST`);
        if (jackpotTriggered) {
          console.log(`  JACKPOT TRIGGERED!`);
          console.log(`  Jackpot winner: ${Buffer.from(jackpotWinner).toString('hex').slice(0, 16)}...`);
          console.log(`  Jackpot amount: ${state.progressivePool} tDUST`);
        }
        console.log(`  TX: ${result.txHash}`);
      }

      // Clean up stored secret
      deleteSecret(api.contractAddress, state.roundNumber);
    });
}

export function cancelCommand(
  getApi: () => Promise<ShadowSniperAPI>,
  logger: Logger,
): Command {
  return new Command('cancel')
    .description('Cancel a timed-out round (anyone can call)')
    .action(async () => {
      const api = await getApi();
      const state = await api.getState();
      if (!state) {
        console.error('Cannot read contract state');
        return;
      }

      if (state.roundStatus !== RoundStatus.Expired) {
        console.error(`Cannot cancel — current status: ${state.roundStatus}`);
        return;
      }

      logger.info('Cancelling round');
      const result = await api.cancelRound();
      console.log(`Round #${state.roundNumber} cancelled — all bets refunded`);
      console.log(`  TX: ${result.txHash}`);
    });
}
