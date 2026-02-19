import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum RoundState { resolved = 0, open = 1 }

export type Witnesses<PS> = {
  operatorSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  startRound(context: __compactRuntime.CircuitContext<PS>,
             newCommitment_0: Uint8Array,
             endTime_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  placeBet(context: __compactRuntime.CircuitContext<PS>, betAmount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  resolveRound(context: __compactRuntime.CircuitContext<PS>,
               secret_0: Uint8Array,
               winnerAddress_0: Uint8Array,
               payoutAmount_0: bigint,
               houseFeeAmount_0: bigint,
               progressiveAmount_0: bigint,
               jackpotTriggered_0: boolean,
               jackpotWinnerAddress_0: Uint8Array,
               rngTarget_0: bigint,
               rngQuotient_0: bigint,
               progRemainder_0: bigint,
               progQuotient_0: bigint,
               progWinnerIndex_0: bigint,
               progWinnerQuotient_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  cancelRound(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  updateConfig(context: __compactRuntime.CircuitContext<PS>,
               newMinBet_0: bigint,
               newMaxBet_0: bigint,
               newDuration_0: bigint,
               newHouseFeeBps_0: bigint,
               newProgressiveBps_0: bigint,
               newTrigger_0: bigint,
               newDeadline_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  withdrawHouseFees(context: __compactRuntime.CircuitContext<PS>,
                    amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
  operatorPublicKey(sk_0: Uint8Array): Uint8Array;
  makeCommitment(secret_0: Uint8Array, rn_0: Uint8Array): Uint8Array;
  deriveSeed(secret_0: Uint8Array, rn_0: Uint8Array, pot_0: Uint8Array): Uint8Array;
  deriveProgressiveSeed(seed_0: Uint8Array, pot_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  operatorPublicKey(context: __compactRuntime.CircuitContext<PS>,
                    sk_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  makeCommitment(context: __compactRuntime.CircuitContext<PS>,
                 secret_0: Uint8Array,
                 rn_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  deriveSeed(context: __compactRuntime.CircuitContext<PS>,
             secret_0: Uint8Array,
             rn_0: Uint8Array,
             pot_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  deriveProgressiveSeed(context: __compactRuntime.CircuitContext<PS>,
                        seed_0: Uint8Array,
                        pot_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  startRound(context: __compactRuntime.CircuitContext<PS>,
             newCommitment_0: Uint8Array,
             endTime_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  placeBet(context: __compactRuntime.CircuitContext<PS>, betAmount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  resolveRound(context: __compactRuntime.CircuitContext<PS>,
               secret_0: Uint8Array,
               winnerAddress_0: Uint8Array,
               payoutAmount_0: bigint,
               houseFeeAmount_0: bigint,
               progressiveAmount_0: bigint,
               jackpotTriggered_0: boolean,
               jackpotWinnerAddress_0: Uint8Array,
               rngTarget_0: bigint,
               rngQuotient_0: bigint,
               progRemainder_0: bigint,
               progQuotient_0: bigint,
               progWinnerIndex_0: bigint,
               progWinnerQuotient_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  cancelRound(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  updateConfig(context: __compactRuntime.CircuitContext<PS>,
               newMinBet_0: bigint,
               newMaxBet_0: bigint,
               newDuration_0: bigint,
               newHouseFeeBps_0: bigint,
               newProgressiveBps_0: bigint,
               newTrigger_0: bigint,
               newDeadline_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  withdrawHouseFees(context: __compactRuntime.CircuitContext<PS>,
                    amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly operator: Uint8Array;
  readonly minBet: bigint;
  readonly maxBet: bigint;
  readonly roundDurationSecs: bigint;
  readonly houseFeeBps: bigint;
  readonly progressiveBps: bigint;
  readonly progressiveTrigger: bigint;
  readonly resolveDeadlineSecs: bigint;
  readonly roundState: RoundState;
  readonly roundNumber: bigint;
  readonly commitment: Uint8Array;
  readonly roundEndTime: bigint;
  readonly roundDeadline: bigint;
  readonly playerCount: bigint;
  readonly totalPot: bigint;
  readonly bet0Active: boolean;
  readonly bet0Player: Uint8Array;
  readonly bet0Amount: bigint;
  readonly bet1Active: boolean;
  readonly bet1Player: Uint8Array;
  readonly bet1Amount: bigint;
  readonly bet2Active: boolean;
  readonly bet2Player: Uint8Array;
  readonly bet2Amount: bigint;
  readonly bet3Active: boolean;
  readonly bet3Player: Uint8Array;
  readonly bet3Amount: bigint;
  readonly bet4Active: boolean;
  readonly bet4Player: Uint8Array;
  readonly bet4Amount: bigint;
  readonly bet5Active: boolean;
  readonly bet5Player: Uint8Array;
  readonly bet5Amount: bigint;
  readonly bet6Active: boolean;
  readonly bet6Player: Uint8Array;
  readonly bet6Amount: bigint;
  readonly bet7Active: boolean;
  readonly bet7Player: Uint8Array;
  readonly bet7Amount: bigint;
  readonly bet8Active: boolean;
  readonly bet8Player: Uint8Array;
  readonly bet8Amount: bigint;
  readonly bet9Active: boolean;
  readonly bet9Player: Uint8Array;
  readonly bet9Amount: bigint;
  readonly progressivePool: bigint;
  readonly houseBalance: bigint;
  readonly lastWinner: Uint8Array;
  readonly lastPayout: bigint;
  readonly lastJackpotWinner: Uint8Array;
  readonly lastJackpotAmount: bigint;
  readonly totalRoundsPlayed: bigint;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               op_0: Uint8Array,
               initMinBet_0: bigint,
               initMaxBet_0: bigint,
               initDuration_0: bigint,
               initHouseFeeBps_0: bigint,
               initProgressiveBps_0: bigint,
               initTrigger_0: bigint,
               initDeadline_0: bigint): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
