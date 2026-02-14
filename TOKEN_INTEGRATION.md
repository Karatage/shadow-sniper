# Token Integration Guide

This document describes the NIGHT token integration for ShadowSniper and how to complete it when the Midnight SDK becomes available.

## Overview

ShadowSniper uses NIGHT tokens (Midnight Network's native token) for all in-game transactions:
- Players send NIGHT to place bets
- Winners receive NIGHT payouts
- House fees accumulate in NIGHT
- Progressive jackpot paid in NIGHT

## Current Status

**Phase 2: Token Integration Prepared** 🔄

All token flow logic is implemented in the contract with placeholder comments marking where SDK calls need to be activated. The contract is **structurally complete** and ready for final SDK integration.

### What's Done ✅

1. **Token flow logic** fully implemented:
   - Bet placement (`placeBet`)
   - Winner payouts (`resolveRound`)
   - Progressive jackpot payouts
   - Refunds (`cancelRound`, single player)
   - House fee withdrawal (`withdrawHouseFees`)

2. **Balance tracking** implemented:
   - `totalPot` tracks total bets in round
   - `houseBalance` tracks accumulated fees
   - `progressivePool` tracks jackpot pool
   - All balances properly updated

3. **Accounting logic** complete:
   - Fee calculations (house + progressive)
   - Payout calculations
   - Balance assertions prevent over-withdrawal

### What's Needed 🔧

When Midnight SDK is available, activate the commented token calls in 6 locations:

## Token Integration Points

### 1. Receiving Bets (`placeBet`)

**Location**: `contract/src/shadow_sniper.compact:193`

**Current Code**:
```compact
// Receive NIGHT tokens from player
// PHASE 2 INTEGRATION: Uncomment when SDK available
// receive(amount);
```

**To Activate**:
```compact
// Receive NIGHT tokens from player
receive(NIGHT_TOKEN_ID, amount, player);
```

**What it does**: Accepts NIGHT tokens from the player's wallet and holds them in the contract as escrow during the round.

---

### 2. Single Player Refund (`resolveRound`)

**Location**: `contract/src/shadow_sniper.compact:230`

**Current Code**:
```compact
// Send full refund to the single player
// PHASE 2 INTEGRATION: Uncomment when SDK available
// send(NIGHT_TOKEN_ID, bet.amount, bet.player);
```

**To Activate**:
```compact
// Send full refund to the single player
send(NIGHT_TOKEN_ID, bet.amount, bet.player);
```

**What it does**: Returns the full bet amount to the single player with no fees charged (edge case handling).

---

### 3. Main Pot Winner Payout (`resolveRound`)

**Location**: `contract/src/shadow_sniper.compact:280`

**Current Code**:
```compact
// Pay main pot winner
// PHASE 2 INTEGRATION: Uncomment when SDK available
// send(NIGHT_TOKEN_ID, mainPayout, winner.player);
```

**To Activate**:
```compact
// Pay main pot winner
send(NIGHT_TOKEN_ID, mainPayout, winner.player);
```

**What it does**: Sends the main pot winnings (pot minus fees) to the weighted-random winner.

---

### 4. Progressive Jackpot Payout (`resolveRound`)

**Location**: `contract/src/shadow_sniper.compact:298`

**Current Code**:
```compact
// Pay progressive jackpot winner
// PHASE 2 INTEGRATION: Uncomment when SDK available
// send(NIGHT_TOKEN_ID, ledger.progressivePool, progressiveWinnerBet.player);
```

**To Activate**:
```compact
// Pay progressive jackpot winner
send(NIGHT_TOKEN_ID, ledger.progressivePool, progressiveWinnerBet.player);
```

**What it does**: Sends the entire progressive pool to the equal-odds winner when jackpot triggers.

---

### 5. Round Cancellation Refunds (`cancelRound`)

**Location**: `contract/src/shadow_sniper.compact:336`

**Current Code**:
```compact
// Refund each player's bet
// PHASE 2 INTEGRATION: Uncomment when SDK available
// send(NIGHT_TOKEN_ID, bet.amount, bet.player);
```

**To Activate**:
```compact
// Refund each player's bet
send(NIGHT_TOKEN_ID, bet.amount, bet.player);
```

**What it does**: Returns each player's bet when operator fails to resolve within deadline (safety valve).

---

### 6. House Fee Withdrawal (`withdrawHouseFees`)

**Location**: `contract/src/shadow_sniper.compact:394`

**Current Code**:
```compact
// Send house fees to operator
// PHASE 2 INTEGRATION: Uncomment when SDK available
// send(NIGHT_TOKEN_ID, amount, ledger.operator);
```

**To Activate**:
```compact
// Send house fees to operator
send(NIGHT_TOKEN_ID, amount, ledger.operator);
```

**What it does**: Allows operator to withdraw accumulated house fees from the contract.

---

## Token ID

The exact `NIGHT_TOKEN_ID` constant needs to be defined based on Midnight SDK documentation. It will likely be:

```compact
const NIGHT_TOKEN_ID: TokenId = /* From Midnight SDK */;
```

Or it may be implicitly available in the Compact runtime.

## API Integration

The TypeScript API in `api/src/shadow-sniper-api.ts` already handles token operations correctly. No changes needed - it will work once the contract's token calls are activated.

### API Methods Affected

- `placeBet(amount)` - Will require user wallet approval
- `resolveRound(secret)` - Will trigger token transfers
- `cancelRound()` - Will trigger refunds
- `withdrawHouseFees(amount)` - Will transfer to operator

## Testing Token Integration

### Unit Tests

Add token balance assertions to contract tests:

```typescript
// Before bet
const playerBalanceBefore = await getTokenBalance(player, NIGHT_TOKEN_ID);

// Place bet
await contract.placeBet(1000n);

// After bet
const playerBalanceAfter = await getTokenBalance(player, NIGHT_TOKEN_ID);
assert.strictEqual(playerBalanceBefore - playerBalanceAfter, 1000n);
```

### Integration Test Flow

1. **Setup**: Fund test wallets with NIGHT tokens
2. **Deploy**: Deploy contract
3. **Start Round**: Operator starts round
4. **Place Bets**: Multiple players bet with real tokens
5. **Verify Escrow**: Check tokens held by contract
6. **Resolve**: Operator resolves round
7. **Verify Payouts**: Check winner received correct amount
8. **Verify Fees**: Check house balance increased
9. **Withdraw**: Operator withdraws fees
10. **Verify Withdrawal**: Check operator received fees

### Edge Case Tests

- **Single player refund**: Verify full refund, no fees
- **Cancel refund**: Verify all players refunded after timeout
- **Progressive trigger**: Verify pool paid out and reset
- **Insufficient balance**: Verify bet rejected if player lacks funds
- **Withdrawal limit**: Verify can't withdraw more than house balance

## Security Considerations

### Reentrancy

Ensure Compact's `send()` function is reentrancy-safe. All state updates happen **before** token transfers, following checks-effects-interactions pattern.

### Overflow Protection

All arithmetic uses Natural (unbounded integers) to prevent overflow. Compact should handle this automatically.

### Authorization

- Only contract can hold player funds during round
- Only winner can claim payout (automated in `resolveRound`)
- Only operator can withdraw house fees
- Anyone can trigger refunds after deadline

### Failed Transfers

If a token transfer fails:
- `placeBet`: Transaction reverts, no state change
- `resolveRound`: Should handle gracefully or revert entire resolution
- `cancelRound`: May need to track failed refunds for manual intervention

Consider adding retry mechanism or claiming system if `send()` can fail silently.

## Wallet Integration

### Frontend Requirements

Web UI will need:
- Lace wallet connection
- NIGHT token approval flow
- Balance display
- Transaction confirmation prompts
- Gas estimation (if applicable on Midnight)

### CLI Requirements

CLI will need:
- Wallet key management (keystore or private key)
- Token approval before `placeBet`
- Balance queries
- Transaction signing

## Migration Path

### Phase 2a: Token Stub Activation
1. Get Midnight SDK access
2. Import token types and functions
3. Define `NIGHT_TOKEN_ID`
4. Uncomment all 6 token calls
5. Compile and test on standalone node

### Phase 2b: Integration Testing
1. Deploy to local testnet with faucet
2. Fund test wallets
3. Run full game cycle with real tokens
4. Verify all token flows
5. Test edge cases

### Phase 2c: Testnet Deployment
1. Deploy to Midnight preprod testnet
2. Test with real wallets
3. Monitor for issues
4. Gather user feedback

### Phase 2d: Mainnet Deployment
1. Security audit of token flows
2. Deploy to Midnight Kukolu mainnet
3. Monitor first rounds closely
4. Set conservative limits initially

## Monitoring & Alerts

Post-deployment, monitor:
- Contract token balance (should match totalPot + progressivePool + houseBalance)
- Failed transfers
- Unexpected balance changes
- Large withdrawals

Set up alerts for:
- Contract balance mismatch
- Operator withdraws >X% of house balance
- Progressive pool exceeds threshold
- Round fails to resolve

## Fallback Mechanisms

If token integration issues arise:
- **Emergency pause**: Add circuit to pause new bets
- **Manual intervention**: Admin function to force refunds
- **Claim system**: Let players claim winnings if auto-send fails

## Next Steps

1. ✅ Token logic implemented (done)
2. ⏳ Wait for Midnight SDK public release
3. 🔧 Activate token calls (6 locations)
4. 🧪 Test on standalone node
5. 🚀 Deploy to testnet
6. 🔍 Security audit
7. 🎉 Mainnet launch

## Documentation Updates Needed

When token integration is complete:
- Update QUICKSTART.md with wallet setup
- Add token approval instructions
- Document gas costs (if any)
- Add troubleshooting for failed transfers
- Update CLI with balance commands

## Questions for Midnight Team

- What is the exact `NIGHT_TOKEN_ID` constant?
- Does `send()` revert or return false on failure?
- Are there gas limits on token transfers?
- Can contracts hold arbitrary token amounts?
- Is there a max transfer size?
- Do transfers require approval from contract?
- How to handle failed batch refunds in `cancelRound`?

---

**Status**: Ready for SDK integration
**Estimated effort**: 2-3 hours once SDK available
**Risk level**: Low (logic complete, just SDK calls needed)
