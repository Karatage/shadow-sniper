/**
 * Bet command - Place a bet in the current round
 */

import { ShadowSniperAPI, formatDuration } from '@shadow-sniper/api';

export interface BetOptions {
  contract: string;
  amount: string;
}

export async function betCommand(options: BetOptions): Promise<void> {
  console.log('💰 Placing bet...\n');

  const api = new ShadowSniperAPI();
  api.connect(options.contract);

  try {
    const amount = BigInt(options.amount);

    // Get current state
    const state = await api.getGameState();

    if (state.currentRound.state !== 'OPEN') {
      console.error('❌ Round is not open for bets');
      process.exit(1);
    }

    // Show round info
    const timeRemaining = state.currentRound.endTime - BigInt(Date.now());
    console.log(`Round #${state.currentRound.roundNumber}`);
    console.log(`Current Pot: ${state.currentRound.totalPot} NIGHT`);
    console.log(`Players: ${state.currentRound.playerCount}`);
    console.log(`Time Remaining: ${formatDuration(timeRemaining)}\n`);

    console.log(`Your Bet: ${amount} NIGHT`);

    // Validate bet
    if (amount < state.config.minBet) {
      console.error(`❌ Bet below minimum of ${state.config.minBet} NIGHT`);
      process.exit(1);
    }

    if (amount > state.config.maxBet) {
      console.error(`❌ Bet above maximum of ${state.config.maxBet} NIGHT`);
      process.exit(1);
    }

    // Calculate odds
    const newPot = state.currentRound.totalPot + amount;
    const winChance = (Number(amount) / Number(newPot) * 100).toFixed(2);
    console.log(`Win Chance: ${winChance}%\n`);

    // Place bet
    const result = await api.placeBet(amount);

    console.log('✅ Bet placed successfully!\n');
    console.log(`Transaction Hash: ${result.transactionHash}`);
    console.log(`\n🎰 Good luck! Check round status:`);
    console.log(`  shadow-sniper status --contract ${options.contract}`);
  } catch (error) {
    console.error('❌ Failed to place bet:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
