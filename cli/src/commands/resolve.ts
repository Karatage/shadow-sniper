/**
 * Resolve command - Operator resolves the round with secret reveal
 */

import { ShadowSniperAPI, hexToBytes } from '@shadow-sniper/api';

export interface ResolveOptions {
  contract: string;
  secret: string;
}

export async function resolveCommand(options: ResolveOptions): Promise<void> {
  console.log('🎯 Resolving round...\n');

  const api = new ShadowSniperAPI();
  api.connect(options.contract);

  try {
    // Parse secret
    const secret = hexToBytes(options.secret);
    if (secret.length !== 32) {
      console.error('❌ Secret must be 32 bytes (64 hex characters)');
      process.exit(1);
    }

    // Get current state
    const state = await api.getGameState();

    if (state.currentRound.state === 'RESOLVED') {
      console.error('❌ No active round to resolve');
      process.exit(1);
    }

    if (BigInt(Date.now()) < state.currentRound.endTime) {
      console.error('❌ Round has not ended yet');
      process.exit(1);
    }

    console.log(`Round #${state.currentRound.roundNumber}`);
    console.log(`Total Pot: ${state.currentRound.totalPot} NIGHT`);
    console.log(`Players: ${state.currentRound.playerCount}\n`);

    // Resolve
    const result = await api.resolveRound(secret);

    console.log('✅ Round resolved successfully!\n');
    console.log(`Transaction Hash: ${result.transactionHash}`);
    console.log(`\n🏆 Check results:`);
    console.log(`  shadow-sniper status --contract ${options.contract}`);
  } catch (error) {
    console.error('❌ Failed to resolve round:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
