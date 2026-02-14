/**
 * Cancel command - Cancel round after timeout and refund all bets
 */

import { ShadowSniperAPI } from '@shadow-sniper/api';

export interface CancelOptions {
  contract: string;
}

export async function cancelCommand(options: CancelOptions): Promise<void> {
  console.log('🚫 Canceling round...\n');

  const api = new ShadowSniperAPI();
  api.connect(options.contract);

  try {
    // Get current state
    const state = await api.getGameState();

    if (state.currentRound.state === 'RESOLVED') {
      console.error('❌ No active round to cancel');
      process.exit(1);
    }

    if (BigInt(Date.now()) <= state.currentRound.resolveDeadline) {
      console.error('❌ Resolve deadline has not passed yet');
      console.log(`   Operator still has time to resolve the round`);
      process.exit(1);
    }

    console.log(`⚠️  Operator failed to resolve round in time`);
    console.log(`   Round #${state.currentRound.roundNumber}`);
    console.log(`   Players: ${state.currentRound.playerCount}`);
    console.log(`   Total to Refund: ${state.currentRound.totalPot} NIGHT\n`);

    // Cancel and refund
    const result = await api.cancelRound();

    console.log('✅ Round canceled successfully!\n');
    console.log(`Transaction Hash: ${result.transactionHash}`);
    console.log(`\n💰 All bets have been refunded to players.`);
  } catch (error) {
    console.error('❌ Failed to cancel round:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
