/**
 * Status command - Show current game state
 */

import { ShadowSniperAPI, formatDuration, formatTimestamp } from '@shadow-sniper/api';

export interface StatusOptions {
  contract: string;
}

export async function statusCommand(options: StatusOptions): Promise<void> {
  const api = new ShadowSniperAPI();
  api.connect(options.contract);

  try {
    const state = await api.getGameState();

    console.log('📊 ShadowSniper Game Status\n');
    console.log('═══════════════════════════════════════════════\n');

    // Contract info
    console.log('📝 Contract Information');
    console.log(`   Address: ${options.contract}`);
    console.log(`   Operator: ${state.operator}`);
    console.log(`   Total Rounds: ${state.totalRounds}\n`);

    // Configuration
    console.log('⚙️  Configuration');
    console.log(`   Min Bet: ${state.config.minBet} NIGHT`);
    console.log(`   Max Bet: ${state.config.maxBet} NIGHT`);
    console.log(`   Round Duration: ${formatDuration(state.config.roundDuration)}`);
    console.log(`   House Fee: ${state.config.houseFeePercent}%`);
    console.log(`   Progressive Fee: ${state.config.progressivePercent}%`);
    console.log(`   Progressive Trigger: ${state.config.progressiveTriggerPercent}%\n`);

    // Current round
    console.log('🎲 Current Round');
    console.log(`   Round #${state.currentRound.roundNumber}`);
    console.log(`   State: ${state.currentRound.state}`);

    if (state.currentRound.state === 'OPEN') {
      const timeRemaining = state.currentRound.endTime - BigInt(Date.now());
      console.log(`   Time Remaining: ${formatDuration(timeRemaining)}`);
      console.log(`   Total Pot: ${state.currentRound.totalPot} NIGHT`);
      console.log(`   Players: ${state.currentRound.playerCount}/100`);
    } else if (state.currentRound.state === 'RESOLVING') {
      console.log(`   ⏳ Waiting for operator to reveal secret...`);
      const deadline = state.currentRound.resolveDeadline;
      if (BigInt(Date.now()) > deadline) {
        console.log(`   ⚠️  Resolve deadline passed! Anyone can cancel and refund bets.`);
      }
    } else {
      console.log(`   Waiting for operator to start next round...`);
    }
    console.log();

    // Progressive jackpot
    console.log('💎 Progressive Jackpot');
    console.log(`   Pool: ${state.progressivePool} NIGHT\n`);

    // House balance
    console.log('🏦 House Balance');
    console.log(`   Balance: ${state.houseBalance} NIGHT\n`);

    // Last result
    if (state.lastResult) {
      console.log('🏆 Last Round Result');
      console.log(`   Round #${state.lastResult.roundNumber}`);
      console.log(`   Winner: ${state.lastResult.winner}`);
      console.log(`   Winner's Bet: ${state.lastResult.winnerBet} NIGHT`);
      console.log(`   Total Pot: ${state.lastResult.totalPot} NIGHT`);
      console.log(`   Payout: ${state.lastResult.payout} NIGHT`);
      if (state.lastResult.progressiveWinner) {
        console.log(`   🎉 Progressive Winner: ${state.lastResult.progressiveWinner}`);
        console.log(`   Progressive Payout: ${state.lastResult.progressivePayout} NIGHT`);
      }
      console.log(`   Time: ${formatTimestamp(state.lastResult.timestamp)}\n`);
    }

    // Current bets
    if (state.bets.length > 0) {
      console.log(`📋 Current Bets (${state.bets.length})`);
      for (const bet of state.bets.slice(0, 10)) {
        const winChance = (Number(bet.amount) / Number(state.currentRound.totalPot) * 100).toFixed(2);
        console.log(`   ${bet.player.slice(0, 10)}... - ${bet.amount} NIGHT (${winChance}%)`);
      }
      if (state.bets.length > 10) {
        console.log(`   ... and ${state.bets.length - 10} more`);
      }
      console.log();
    }

  } catch (error) {
    console.error('❌ Failed to get status:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
