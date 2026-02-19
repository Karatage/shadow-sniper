/**
 * ShadowSniper API — TypeScript wrapper for the ShadowSniper smart contract.
 *
 * @packageDocumentation
 */

import {
  Contract as ShadowSniperContractClass,
  ledger as parseLedger,
  pureCircuits,
  RoundState as ContractRoundState,
  type Ledger as LedgerType,
  type PureCircuits,
} from '@shadow-sniper/contract';

import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { type Logger } from 'pino';
import {
  type ShadowSniperProviders,
  type DeployedShadowSniperContract,
  type ShadowSniperPrivateState,
  shadowSniperPrivateStateKey,
} from './common-types.js';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { map, tap, type Observable } from 'rxjs';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import {
  type GameState,
  type GameConfig,
  type Bet,
  type RoundResult,
  type TxResult,
  RoundStatus,
} from './types.js';
import { DeploymentError, TransactionError } from './errors.js';

/**
 * Maps raw ledger state to a clean GameState domain type.
 */
function mapLedgerToGameState(ledgerState: LedgerType): GameState {
  const config: GameConfig = {
    operator: ledgerState.operator,
    minBet: ledgerState.minBet,
    maxBet: ledgerState.maxBet,
    roundDurationSecs: ledgerState.roundDurationSecs,
    houseFeeBps: ledgerState.houseFeeBps,
    progressiveBps: ledgerState.progressiveBps,
    progressiveTrigger: ledgerState.progressiveTrigger,
    resolveDeadlineSecs: ledgerState.resolveDeadlineSecs,
  };

  const bets: Bet[] = [];
  const betFields = [
    { active: ledgerState.bet0Active, player: ledgerState.bet0Player, amount: ledgerState.bet0Amount },
    { active: ledgerState.bet1Active, player: ledgerState.bet1Player, amount: ledgerState.bet1Amount },
    { active: ledgerState.bet2Active, player: ledgerState.bet2Player, amount: ledgerState.bet2Amount },
    { active: ledgerState.bet3Active, player: ledgerState.bet3Player, amount: ledgerState.bet3Amount },
    { active: ledgerState.bet4Active, player: ledgerState.bet4Player, amount: ledgerState.bet4Amount },
    { active: ledgerState.bet5Active, player: ledgerState.bet5Player, amount: ledgerState.bet5Amount },
    { active: ledgerState.bet6Active, player: ledgerState.bet6Player, amount: ledgerState.bet6Amount },
    { active: ledgerState.bet7Active, player: ledgerState.bet7Player, amount: ledgerState.bet7Amount },
    { active: ledgerState.bet8Active, player: ledgerState.bet8Player, amount: ledgerState.bet8Amount },
    { active: ledgerState.bet9Active, player: ledgerState.bet9Player, amount: ledgerState.bet9Amount },
  ];
  for (const b of betFields) {
    bets.push({ active: b.active, player: b.player, amount: b.amount });
  }

  // Determine round status based on state + time
  let roundStatus: RoundStatus;
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (ledgerState.roundState === ContractRoundState.resolved) {
    roundStatus = RoundStatus.Resolved;
  } else if (now < ledgerState.roundEndTime) {
    roundStatus = RoundStatus.Open;
  } else if (now < ledgerState.roundDeadline) {
    roundStatus = RoundStatus.WaitingToResolve;
  } else {
    roundStatus = RoundStatus.Expired;
  }

  const lastResult: RoundResult = {
    winner: ledgerState.lastWinner,
    payout: ledgerState.lastPayout,
    jackpotWinner: ledgerState.lastJackpotWinner,
    jackpotAmount: ledgerState.lastJackpotAmount,
  };

  return {
    config,
    roundStatus,
    roundNumber: ledgerState.roundNumber,
    commitment: ledgerState.commitment,
    roundEndTime: ledgerState.roundEndTime,
    roundDeadline: ledgerState.roundDeadline,
    playerCount: ledgerState.playerCount,
    totalPot: ledgerState.totalPot,
    bets,
    progressivePool: ledgerState.progressivePool,
    houseBalance: ledgerState.houseBalance,
    lastResult,
    totalRoundsPlayed: ledgerState.totalRoundsPlayed,
  };
}

/**
 * API for interacting with a deployed ShadowSniper contract.
 */
export class ShadowSniperAPI {
  /** @internal */
  private constructor(
    public readonly deployedContract: DeployedShadowSniperContract,
    private readonly providers: ShadowSniperProviders,
    private readonly logger?: Logger,
  ) {
    this.contractAddress = deployedContract.deployTxData.public.contractAddress;
    this.state$ = providers.publicDataProvider
      .contractStateObservable(this.contractAddress, { type: 'latest' })
      .pipe(
        map((contractState) => parseLedger(contractState.data)),
        tap((ledgerState) =>
          logger?.trace({
            ledgerStateChanged: {
              roundState: ledgerState.roundState === ContractRoundState.open ? 'open' : 'resolved',
              playerCount: Number(ledgerState.playerCount),
              totalPot: Number(ledgerState.totalPot),
              roundNumber: Number(ledgerState.roundNumber),
            },
          }),
        ),
        map(mapLedgerToGameState),
      );
  }

  /** The deployed contract's address */
  readonly contractAddress: ContractAddress;

  /** Observable stream of game state changes */
  readonly state$: Observable<GameState>;

  /**
   * Read the current game state directly (non-reactive).
   */
  async getState(): Promise<GameState | null> {
    const contractState = await this.providers.publicDataProvider.queryContractState(
      this.contractAddress,
    );
    if (!contractState) return null;
    const ledgerState = parseLedger(contractState.data);
    return mapLedgerToGameState(ledgerState);
  }

  /**
   * Start a new round with a commitment.
   */
  async startRound(commitment: Uint8Array, roundEndTime: bigint): Promise<TxResult> {
    this.logger?.info({ roundEndTime: Number(roundEndTime) }, 'Starting round');
    try {
      const txData = await this.deployedContract.callTx.startRound(commitment, roundEndTime);
      this.logger?.trace({
        transactionAdded: { circuit: 'startRound', txHash: txData.public.txHash },
      });
      return { txHash: txData.public.txHash, blockHeight: txData.public.blockHeight };
    } catch (e) {
      throw new TransactionError('Failed to start round', e);
    }
  }

  /**
   * Place a bet in the current round.
   */
  async placeBet(betAmount: bigint): Promise<TxResult> {
    this.logger?.info({ betAmount: Number(betAmount) }, 'Placing bet');
    try {
      // Note: The coin parameter is provided by the wallet during transaction balancing
      const txData = await this.deployedContract.callTx.placeBet(betAmount);
      this.logger?.trace({
        transactionAdded: { circuit: 'placeBet', txHash: txData.public.txHash },
      });
      return { txHash: txData.public.txHash, blockHeight: txData.public.blockHeight };
    } catch (e) {
      throw new TransactionError('Failed to place bet', e);
    }
  }

  /**
   * Resolve the current round with the revealed secret.
   */
  async resolveRound(
    secret: Uint8Array,
    winnerAddress: Uint8Array,
    payoutAmount: bigint,
    houseFeeAmount: bigint,
    progressiveAmount: bigint,
    jackpotTriggered: boolean,
    jackpotWinnerAddress: Uint8Array,
    rngTarget: bigint,
    rngQuotient: bigint,
    progRemainder: bigint,
    progQuotient: bigint,
    progWinnerIndex: bigint,
    progWinnerQuotient: bigint,
  ): Promise<TxResult> {
    this.logger?.info(
      {
        winner: toHex(winnerAddress),
        payout: Number(payoutAmount),
        jackpotTriggered,
      },
      'Resolving round',
    );
    try {
      const txData = await this.deployedContract.callTx.resolveRound(
        secret,
        winnerAddress,
        payoutAmount,
        houseFeeAmount,
        progressiveAmount,
        jackpotTriggered,
        jackpotWinnerAddress,
        rngTarget,
        rngQuotient,
        progRemainder,
        progQuotient,
        progWinnerIndex,
        progWinnerQuotient,
      );
      this.logger?.trace({
        transactionAdded: { circuit: 'resolveRound', txHash: txData.public.txHash },
      });
      return { txHash: txData.public.txHash, blockHeight: txData.public.blockHeight };
    } catch (e) {
      throw new TransactionError('Failed to resolve round', e);
    }
  }

  /**
   * Cancel a timed-out round (anyone can call this).
   */
  async cancelRound(): Promise<TxResult> {
    this.logger?.info('Cancelling round');
    try {
      const txData = await this.deployedContract.callTx.cancelRound();
      this.logger?.trace({
        transactionAdded: { circuit: 'cancelRound', txHash: txData.public.txHash },
      });
      return { txHash: txData.public.txHash, blockHeight: txData.public.blockHeight };
    } catch (e) {
      throw new TransactionError('Failed to cancel round', e);
    }
  }

  /**
   * Update game configuration (operator only, between rounds).
   */
  async updateConfig(
    minBet: bigint,
    maxBet: bigint,
    duration: bigint,
    houseFeeBps: bigint,
    progressiveBps: bigint,
    trigger: bigint,
    deadline: bigint,
  ): Promise<TxResult> {
    this.logger?.info('Updating config');
    try {
      const txData = await this.deployedContract.callTx.updateConfig(
        minBet,
        maxBet,
        duration,
        houseFeeBps,
        progressiveBps,
        trigger,
        deadline,
      );
      this.logger?.trace({
        transactionAdded: { circuit: 'updateConfig', txHash: txData.public.txHash },
      });
      return { txHash: txData.public.txHash, blockHeight: txData.public.blockHeight };
    } catch (e) {
      throw new TransactionError('Failed to update config', e);
    }
  }

  /**
   * Withdraw accumulated house fees (operator only).
   */
  async withdrawHouseFees(amount: bigint): Promise<TxResult> {
    this.logger?.info({ amount: Number(amount) }, 'Withdrawing house fees');
    try {
      const txData = await this.deployedContract.callTx.withdrawHouseFees(amount);
      this.logger?.trace({
        transactionAdded: { circuit: 'withdrawHouseFees', txHash: txData.public.txHash },
      });
      return { txHash: txData.public.txHash, blockHeight: txData.public.blockHeight };
    } catch (e) {
      throw new TransactionError('Failed to withdraw house fees', e);
    }
  }

  /**
   * Access the contract's pure circuits for off-chain computation.
   */
  get pureCircuits() {
    return pureCircuits;
  }

  /**
   * Deploy a new ShadowSniper contract.
   */
  static async deploy(
    providers: ShadowSniperProviders,
    operatorPublicKey: Uint8Array,
    config: {
      minBet: bigint;
      maxBet: bigint;
      roundDurationSecs: bigint;
      houseFeeBps: bigint;
      progressiveBps: bigint;
      progressiveTrigger: bigint;
      resolveDeadlineSecs: bigint;
    },
    logger?: Logger,
  ): Promise<ShadowSniperAPI> {
    logger?.info('Deploying ShadowSniper contract');

    try {
      // SDK type assertions needed — exact API depends on Midnight SDK version
      // and is validated during integration testing with a running node
      const deployedContract = await (deployContract as any)(providers, {
        compiledContract: ShadowSniperContractClass,
        privateStateId: shadowSniperPrivateStateKey,
        initialPrivateState: await ShadowSniperAPI.getPrivateState(providers),
        constructorArgs: [
          operatorPublicKey,
          config.minBet,
          config.maxBet,
          config.roundDurationSecs,
          config.houseFeeBps,
          config.progressiveBps,
          config.progressiveTrigger,
          config.resolveDeadlineSecs,
        ],
      });

      logger?.info(
        { contractAddress: deployedContract.deployTxData.public.contractAddress },
        'Contract deployed',
      );

      return new ShadowSniperAPI(deployedContract as any, providers, logger);
    } catch (e) {
      throw new DeploymentError('Failed to deploy ShadowSniper contract', e);
    }
  }

  /**
   * Connect to an existing deployed ShadowSniper contract.
   */
  static async connect(
    providers: ShadowSniperProviders,
    contractAddress: ContractAddress,
    logger?: Logger,
  ): Promise<ShadowSniperAPI> {
    logger?.info({ contractAddress }, 'Connecting to ShadowSniper contract');

    try {
      const deployedContract = await (findDeployedContract as any)(providers, {
        contractAddress,
        compiledContract: ShadowSniperContractClass,
        privateStateId: shadowSniperPrivateStateKey,
        initialPrivateState: await ShadowSniperAPI.getPrivateState(providers),
      });

      logger?.info(
        { contractAddress: deployedContract.deployTxData.public.contractAddress },
        'Connected to contract',
      );

      return new ShadowSniperAPI(deployedContract as any, providers, logger);
    } catch (e) {
      throw new DeploymentError('Failed to connect to ShadowSniper contract', e);
    }
  }

  private static async getPrivateState(
    providers: ShadowSniperProviders,
  ): Promise<ShadowSniperPrivateState> {
    const existing = await providers.privateStateProvider.get(shadowSniperPrivateStateKey);
    return existing ?? { operatorSecretKey: new Uint8Array(32) };
  }
}

export * as utils from './utils/index.js';
export * from './common-types.js';
export * from './types.js';
export * from './errors.js';
