# ShadowSniper - Game Design Document

## Overview

ShadowSniper is a PvP betting game on Midnight Network (a privacy-focused L2 on Cardano). Players enter 5-minute rounds by placing bets into a shared pot. When the round ends, a winner is chosen at random — weighted by bet size. A separate progressive jackpot gives every player an equal shot at a big payout, regardless of how much they wagered.

All game logic runs on-chain via a Compact smart contract.

## Core Mechanics

### Rounds

- Rounds are **sequential** — only one round is active at a time, with no overlap.
- Each round lasts **5 minutes** (configurable).
- An operator service manages the round lifecycle automatically, starting the next round immediately after resolving the previous one to minimize dead time.
- Players can join any open round by placing a bet.
- A **minimum of 2 players** is required for a round to resolve with a winner. 0 players = no payout; 1 player = full refund (no fees charged); 2+ players = normal resolution.

### Betting

- Each player places **one bet per round**. Once placed, it cannot be changed or withdrawn.
- Bets have a **minimum** and **maximum** limit (both configurable).
- The bet is transferred to the contract and held in escrow until the round resolves.

### Main Pot

When the round ends, a winner is selected via **weighted random selection**:

- Each player's chance of winning is proportional to their bet size relative to the total pot.
- Example: if the pot is 1000 tDUST and you bet 200 tDUST, you have a 20% chance of winning.

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
- **Trigger probability** — the jackpot doesn't fire every round. The trigger is deterministic: `seed % triggerDenominator == 0`, where `triggerDenominator` defaults to 100 (giving a 1-in-100 chance per round). The seed comes from the commit-reveal scheme, so the trigger is verifiable and unpredictable. When it doesn't trigger, the pool keeps growing.
- **Full payout** — when triggered, the entire progressive pool is awarded to the winner.

### Configurable Parameters

| Parameter | Default | Type | Description |
|---|---|---|---|
| Round duration | 5 minutes | `Uint<32>` | How long each betting round lasts (in seconds) |
| House fee | 3% | `Uint<32>` | Percentage of pot taken as operator revenue (basis points) |
| Progressive contribution | 1% | `Uint<32>` | Percentage of pot added to progressive pool (basis points) |
| Minimum bet | TBD | `Uint<64>` | Lowest allowed bet per player |
| Maximum bet | TBD | `Uint<64>` | Highest allowed bet per player (fairness cap) |
| Max players | 50 | `Uint<32>` | Maximum players per round (compile-time bound) |
| Progressive trigger | 1 in 100 | `Uint<32>` | Denominator for `seed % triggerDenominator == 0` check |
| Resolve deadline | 5 minutes | `Uint<32>` | Time after round end for operator to resolve before cancellation is allowed (in seconds) |

All parameters except max players can be changed by the operator between rounds. Max players is a compile-time constant due to Compact's bounded iteration requirement.

## Randomness (RNG)

Midnight Network uses zero-knowledge proofs, which means smart contract circuits must be deterministic — there's no native on-chain randomness. ShadowSniper uses an **operator commit-reveal scheme**:

### How It Works

1. **When starting the round**, the operator generates a random secret and passes the **commitment** (hash of the secret + round number) as an argument to `startRound()`. This is atomic — one transaction opens the round with a locked commitment. At this point, no bets have been placed — the operator cannot know the outcome.
2. **During the round**, players place their bets. The operator's commitment is already locked.
3. **After the round ends**, the operator **reveals** the secret. The contract verifies it matches the commitment.
4. The **random seed** is derived from: `hash(secret, roundNumber, totalPot)`. Including the total pot adds entropy, though it provides limited additional unpredictability since the operator may be able to predict pot totals in low-traffic rounds. A future iteration could mix in individual player addresses or bet ordering for stronger entropy.
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

Cancelled rounds **do not affect the progressive pool** — since all bets are refunded in full, no contribution is collected.

## Token Model

ShadowSniper uses **tDUST** (testnet) / **DUST** (mainnet) tokens for all bets and payouts. These are Midnight's native tokens — tDUST is used during development and testing, while DUST is the production token on mainnet. Throughout this document, "tDUST" refers to whichever variant applies to the current network.

### Token Flow

```
Player Wallet (tDUST)
        │
        │ placeBet() — player sends tDUST to contract
        ▼
   Contract Escrow (holds all bets)
        │
        ├── resolveRound()
        │   ├──────────────────────────────────────┐
        │   ▼                                      ▼
        │  Winner Payout (96%)          House Fee (3%) + Progressive (1%)
        │  → sent to winner's wallet    → house balance (withdrawable)
        │                               → progressive pool (accumulates)
        │
        └── cancelRound() (operator failed to resolve in time)
            ▼
        Full Refund (100%)
        → each player's bet returned to their wallet
        → no fees charged, progressive pool unchanged
```

- **House fees** accumulate in the contract and are withdrawn by the operator via `withdrawHouseFees()`.
- **Progressive pool** stays in the contract until a jackpot is triggered, then the full amount is sent to the winner.

## Operator Authentication

The operator is identified by a **public key stored in contract state**, set at deploy time. All operator-only actions (`startRound()`, `resolveRound()`, `withdrawHouseFees()`, and config updates) require proving ownership of the corresponding private key via a **witness** (Midnight's mechanism for private proof verification).

This means only the entity that deployed the contract can operate the game. Key rotation is listed under Future Considerations — for now, the operator key is immutable after deployment.

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
