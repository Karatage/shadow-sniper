/**
 * Deploy command - Deploy a new ShadowSniper contract
 */

import { ShadowSniperAPI } from '@shadow-sniper/api';

export interface DeployOptions {
  operator: string;
  minBet?: string;
  maxBet?: string;
  roundDuration?: string;
  houseFee?: string;
  progressive?: string;
  progressiveTrigger?: string;
  resolveDeadline?: string;
}

export async function deployCommand(options: DeployOptions): Promise<void> {
  console.log('🚀 Deploying ShadowSniper contract...\n');

  const api = new ShadowSniperAPI();

  try {
    const deployment = await api.deploy({
      operatorAddress: options.operator,
      minBet: options.minBet ? BigInt(options.minBet) : undefined,
      maxBet: options.maxBet ? BigInt(options.maxBet) : undefined,
      roundDuration: options.roundDuration ? BigInt(options.roundDuration) : undefined,
      houseFeePercent: options.houseFee ? BigInt(options.houseFee) : undefined,
      progressivePercent: options.progressive ? BigInt(options.progressive) : undefined,
      progressiveTriggerPercent: options.progressiveTrigger ? BigInt(options.progressiveTrigger) : undefined,
      resolveDeadline: options.resolveDeadline ? BigInt(options.resolveDeadline) : undefined
    });

    console.log('✅ Contract deployed successfully!\n');
    console.log(`Contract Address: ${deployment.contractAddress}`);
    console.log(`Transaction Hash: ${deployment.transactionHash}`);
    console.log(`Block Number: ${deployment.blockNumber}\n`);

    console.log('💡 Save the contract address to interact with the game later.');
    console.log(`   Example: shadow-sniper status --contract ${deployment.contractAddress}`);
  } catch (error) {
    console.error('❌ Deployment failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
