# ShadowSniper Smart Contract

The core Compact smart contract implementing ShadowSniper's game logic on Midnight Network.

## Contract Overview

`shadow_sniper.compact` implements a PvP betting game with:
- **5-minute rounds** with configurable duration
- **Single, immutable bets** per player per round
- **Weighted RNG** for main pot winner (bigger bet = higher odds)
- **Progressive jackpot** with equal odds per player
- **Operator commit-reveal** RNG scheme
- **Safety valve** for operator timeout with automatic refunds

## Key Components

### Ledger State

All game state is **fully public** (using `disclose`) for transparency:

- `operator`: Game operator address
- `config`: Round configuration (bet limits, fees, durations)
- `currentRound`: Active round state
- `bets`: Vector of all bets in current round (max 100 players)
- `progressivePool`: Accumulated progressive jackpot
- `houseBalance`: Accumulated house fees
- `totalRounds`: Total rounds played
- `lastResult`: Most recent round result

### Circuit Functions

1. **`constructor()`** - Initialize contract with operator and configuration
2. **`startRound(commitment)`** - Operator starts round with RNG commitment hash
3. **`placeBet(amount)`** - Player places bet (validated, single per round)
4. **`resolveRound(secret)`** - Operator reveals secret, contract verifies and selects winners
5. **`cancelRound()`** - Safety valve: anyone can trigger after deadline, refunds all bets
6. **`updateConfig(...)`** - Operator updates game parameters between rounds
7. **`withdrawHouseFees(amount)`** - Operator withdraws accumulated fees

### RNG Scheme

**Commitment Phase** (before round opens):
```
commitment = sha256(secret || roundNumber)
```

**Reveal Phase** (after round ends):
```
randomSeed = sha256(secret || roundNumber || totalPot)
```

Contract verifies: `sha256(secret || roundNumber) == commitment`

**Winner Selection**:
- Main pot: Weighted random (cumulative weights vs random target)
- Progressive: Equal probability (random index selection)

### Edge Cases Handled

- **0 players**: Round resolves, no payouts
- **1 player**: Full refund, no fees charged
- **Operator timeout**: Anyone can `cancelRound()` after deadline, all bets refunded
- **Invalid secret**: Assert fails, transaction reverts
- **Double bet**: Assertion prevents multiple bets from same address
- **Late bet**: Block time check rejects bets after round end
- **Max players**: Assertion prevents more than `MAX_PLAYERS` (100)

## Compilation

```bash
npm run build
```

This runs `compact compile src/shadow_sniper.compact`, generating TypeScript bindings in `managed/`.

## Testing

```bash
npm test
```

Runs unit tests in `src/test/shadow_sniper.test.ts`.

## Token Integration (Phase 2)

**Status: Prepared for SDK Integration** 🔄

Token flow logic is fully implemented with placeholder comments marking SDK activation points:
- ✅ `placeBet()`: `receive()` call prepared (line 193)
- ✅ `resolveRound()`: `send()` calls prepared for payouts (lines 230, 280, 298)
- ✅ `cancelRound()`: `send()` calls prepared for refunds (line 336)
- ✅ `withdrawHouseFees()`: `send()` call prepared (line 394)

All accounting logic complete. See [TOKEN_INTEGRATION.md](../TOKEN_INTEGRATION.md) for activation guide.

## Configuration Defaults

Recommended starting values:
- `minBet`: 100 NIGHT (0.1 NIGHT)
- `maxBet`: 10000 NIGHT (10 NIGHT)
- `roundDuration`: 300000 (5 minutes in ms)
- `houseFeePercent`: 3 (3%)
- `progressivePercent`: 1 (1%)
- `progressiveTriggerPercent`: 1 (1% chance per round)
- `resolveDeadline`: 300000 (5 minutes to reveal secret)

## Security Considerations

1. **Commitment safety**: Operator commits BEFORE seeing any bets (prevents manipulation)
2. **Timeout protection**: Players' funds are safe even if operator disappears
3. **No double-betting**: Each address can only bet once per round
4. **Validation**: All inputs validated with assertions
5. **Transparency**: All data publicly disclosed for verifiability

## Future Enhancements

- Token integration (Phase 2)
- Pause/emergency stop mechanism
- Operator rotation
- Multi-token support
- Dynamic max players based on gas limits
