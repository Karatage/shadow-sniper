# ShadowSniper - Game Design Document

## Overview

ShadowSniper is a PvP betting game on Midnight Network (a privacy-focused L2 on Cardano). Players enter 5-minute rounds by placing bets into a shared pot. When the round ends, a winner is chosen at random — weighted by bet size. A separate progressive jackpot gives every player an equal shot at a big payout, regardless of how much they wagered.

All game logic runs on-chain via a Compact smart contract.

## Core Mechanics

### Rounds

- Rounds run continuously, each lasting **5 minutes** (configurable).
- An operator service manages the round lifecycle automatically.
- Players can join any open round by placing a bet.

### Betting

- Each player places **one bet per round**. Once placed, it cannot be changed or withdrawn.
- Bets have a **minimum** and **maximum** limit (both configurable).
- The bet is transferred to the contract and held in escrow until the round resolves.

### Main Pot

When the round ends, a winner is selected via **weighted random selection**:

- Each player's chance of winning is proportional to their bet size relative to the total pot.
- Example: if the pot is 1000 NIGHT and you bet 200 NIGHT, you have a 20% chance of winning.

The winner receives the pot minus two deductions:

| Deduction | Default | Description |
|---|---|---|
| House fee | 3% | Revenue for the operator |
| Progressive contribution | 1% | Feeds the progressive jackpot pool |

All percentages are configurable by the operator between rounds.

### Progressive Jackpot

The progressive jackpot is a separate prize pool that grows over time, funded by the 1% contribution from every round's pot.

Key properties:
- **Equal odds** — every player in the round has the same chance of winning, regardless of bet size. This is the "equalizer" that keeps the game exciting for everyone.
- **Independent RNG** — the progressive winner is determined by a separate random roll from the main pot winner.
- **Both can be won** — a lucky player can win the main pot AND the progressive jackpot in the same round.
- **Trigger probability** — the jackpot doesn't fire every round. There's a configurable chance (e.g., 1 in 100) that it triggers in any given round. When it doesn't trigger, the pool keeps growing.
- **Full payout** — when triggered, the entire progressive pool is awarded to the winner.

### Configurable Parameters

| Parameter | Default | Description |
|---|---|---|
| Round duration | 5 minutes | How long each betting round lasts |
| House fee | 3% | Percentage of pot taken as operator revenue |
| Progressive contribution | 1% | Percentage of pot added to progressive pool |
| Minimum bet | TBD | Lowest allowed bet per player |
| Maximum bet | TBD | Highest allowed bet per player (fairness cap) |
| Max players | 50 | Maximum players per round (compile-time bound) |
| Progressive trigger | 1 in 100 | Probability of progressive jackpot firing per round |
| Resolve deadline | 5 minutes | Time after round end for operator to resolve before cancellation is allowed |

All parameters except max players can be changed by the operator between rounds. Max players is a compile-time constant due to Compact's bounded iteration requirement.

## Randomness (RNG)

Midnight Network uses zero-knowledge proofs, which means smart contract circuits must be deterministic — there's no native on-chain randomness. ShadowSniper uses an **operator commit-reveal scheme**:

### How It Works

1. **Before the round opens**, the operator generates a random secret and publishes a **commitment** (hash of the secret + round number) on-chain. At this point, no bets have been placed — the operator cannot know the outcome.
2. **During the round**, players place their bets. The operator's commitment is already locked.
3. **After the round ends**, the operator **reveals** the secret. The contract verifies it matches the commitment.
4. The **random seed** is derived from: `hash(secret, roundNumber, totalPot)`. Including the total pot adds entropy that the operator couldn't predict at commit time.
5. The seed determines both the main pot winner (weighted selection) and the progressive jackpot winner (equal selection).

### Weighted Winner Selection

The random seed is converted to a number in the range `[0, totalPot)`. Players are laid out on a number line where each player occupies a segment proportional to their bet. The segment that contains the random number wins.

```
Example: 3 players, total pot = 1000
  Player A: bet 500 → occupies [0, 500)
  Player B: bet 300 → occupies [500, 800)
  Player C: bet 200 → occupies [800, 1000)

  Random number = 650 → Player B wins
```

Implemented as a `fold` over a fixed-size array with cumulative weight accumulation.

### Progressive Winner Selection

A separate seed (derived from the main seed) is used to pick a random player index with equal probability: `winnerIndex = seed % playerCount`. Every player has a `1 / playerCount` chance.

### Safety Valve

If the operator fails to reveal their secret within the resolve deadline (e.g., 5 minutes after round end), **anyone** can call `cancelRound()` to refund all bets. This prevents the operator from holding funds hostage.

## Token Model

ShadowSniper uses Midnight's native **NIGHT** tokens for all bets and payouts.

### Token Flow

```
Player Wallet (NIGHT)
        │
        │ placeBet() — player sends NIGHT to contract
        ▼
   Contract Escrow (holds all bets)
        │
        │ resolveRound()
        ├──────────────────────────────────────┐
        ▼                                      ▼
   Winner Payout (96%)              House Fee (3%) + Progressive (1%)
   → sent to winner's wallet        → house balance (withdrawable)
                                    → progressive pool (accumulates)
```

- **House fees** accumulate in the contract and are withdrawn by the operator via `withdrawHouseFees()`.
- **Progressive pool** stays in the contract until a jackpot is triggered, then the full amount is sent to the winner.

## Data Transparency

All game data is fully public on-chain. Player wallet addresses, bet amounts, win/loss results, and round history are all disclosed. This enables:

- **Leaderboards** — top winners, biggest pots, longest win streaks
- **Round history** — full replay of who played, what they bet, and who won
- **Player profiles** — total wagered, total won, rounds played, win rate
- **Win streaks** — consecutive round wins tracked per player

All statistics are built by indexing on-chain ledger state. The Midnight indexer feeds this data to the UI for real-time display.

## Edge Cases

| Scenario | Behavior |
|---|---|
| 0 players in round | Round resolves with no payouts. Progressive pool unchanged. |
| 1 player in round | Full refund — no fees charged. You need competition to play. |
| Operator doesn't resolve | Anyone can cancel after resolve deadline. All bets refunded. |
| Operator submits wrong secret | Transaction reverts (assert failure). Must submit correct secret. |
| Player tries to bet twice | Transaction reverts. One bet per round, enforced on-chain. |
| Player bets after round ends | Transaction rejected by time constraint. Tokens stay in wallet. |
| Max players reached | Transaction reverts. Player must wait for the next round. |
| Progressive pool overflows | Uint<64> supports up to ~18.4 quintillion. Practically unlimited. Optional cap configurable. |

## State Machine

```
RESOLVED ──[startRound()]──▶ OPEN ──[time expires]──▶ RESOLVING ──[resolveRound()]──▶ RESOLVED
                                                           │
                                                    [timeout expires]
                                                           │
                                                    [cancelRound()]
                                                           │
                                                           ▼
                                                       RESOLVED
                                                    (all bets refunded)
```

- **RESOLVED**: No active round. Operator can start a new round or update config.
- **OPEN**: Betting is active. Players can place bets. Time-bounded.
- **RESOLVING**: Betting closed. Waiting for operator to reveal secret and determine winners.

## Future Considerations

- **VRF upgrade**: Replace operator commit-reveal with a Verifiable Random Function (ECVRF) for stronger cryptographic guarantees. The operator publishes a VRF public key, and the output is deterministic and verifiable without trusting the operator.
- **Multiple rooms**: Different game rooms with different bet ranges (low/mid/high stakes).
- **Governance**: DAO-based operator key rotation and parameter changes.
- **Cross-chain**: LayerZero integration for players on Ethereum/Solana to participate.
- **Tournament mode**: Scheduled tournaments with fixed buy-ins and bracket elimination.
