/**
 * Start Round command - Operator starts a new round
 */

import { ShadowSniperAPI, generateSecret, createCommitment, bytesToHex } from '@shadow-sniper/api';

export interface StartRoundOptions {
  contract: string;
  secret?: string;
}

export async function startRoundCommand(options: StartRoundOptions): Promise<void> {
  console.log('🎲 Starting new round...\n');

  const api = new ShadowSniperAPI();
  api.connect(options.contract);

  try {
    // Get current state
    const state = await api.getGameState();

    if (state.currentRound.state !== 'RESOLVED') {
      console.error('❌ Cannot start round: previous round not resolved');
      process.exit(1);
    }

    // Generate or use provided secret
    let secret: Uint8Array;
    if (options.secret) {
      secret = Buffer.from(options.secret, 'hex');
      if (secret.length !== 32) {
        console.error('❌ Secret must be 32 bytes (64 hex characters)');
        process.exit(1);
      }
    } else {
      secret = generateSecret();
      console.log(`🔐 Generated random secret: ${bytesToHex(secret)}`);
      console.log('⚠️  IMPORTANT: Save this secret! You will need it to resolve the round.\n');
    }

    // Create commitment
    const nextRoundNumber = state.totalRounds + 1n;
    const commitment = createCommitment(secret, nextRoundNumber);

    console.log(`Round Number: ${nextRoundNumber}`);
    console.log(`Commitment: ${bytesToHex(commitment)}\n`);

    // Start the round
    const result = await api.startRound(commitment);

    console.log('✅ Round started successfully!\n');
    console.log(`Transaction Hash: ${result.transactionHash}`);
    console.log(`\nPlayers can now bet using:`);
    console.log(`  shadow-sniper bet --contract ${options.contract} --amount <AMOUNT>`);
  } catch (error) {
    console.error('❌ Failed to start round:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
