# ShadowSniper

A PvP betting game on [Midnight Network](https://midnight.network/).

Players enter 5-minute rounds by placing bets into a shared pot. When the round ends, a winner is chosen at random — the bigger your bet, the higher your chance. A separate progressive jackpot gives every player an equal shot at a big payout, regardless of bet size.

All game logic runs on-chain via a Compact smart contract on Midnight (L2 on Cardano).

## How It Works

1. A round opens. Players place bets (one per round, immutable).
2. Round ends after 5 minutes. A winner is selected via weighted RNG.
3. Winner takes the pot, minus a small house fee and progressive jackpot contribution.
4. A separate roll determines if the progressive jackpot fires — every player has equal odds.
5. Next round starts immediately.

## Docs

- [Game Design](./DESIGN.md) — full game mechanics, RNG scheme, token flow, edge cases
- [Implementation Plan](./PLAN.md) — tech stack, architecture decisions, project structure, phased roadmap

## Tech Stack

- **Smart contract**: [Compact](https://docs.midnight.network/compact) (Midnight's TypeScript-like DSL)
- **DApp layer**: TypeScript
- **Network**: [Midnight](https://midnight.network/) (Kukolu phase)
- **Wallet**: Midnight Lace wallet

## Status

**Phase 1 Complete** ✅

- Smart contract implemented in Compact
- TypeScript API wrapper
- CLI tool with all commands
- Docker local development stack

See [PLAN.md](./PLAN.md) for roadmap and [QUICKSTART.md](./QUICKSTART.md) to get started.

## Quick Start

```bash
# Install dependencies
npm install

# Build project
npm run build

# Start local Midnight node
cd docker && docker-compose up -d

# Deploy contract
npx shadow-sniper deploy --operator <YOUR_ADDRESS>

# Start a round
npx shadow-sniper start-round --contract <CONTRACT_ADDRESS>

# Place a bet
npx shadow-sniper bet --contract <CONTRACT_ADDRESS> --amount 1000

# Check status
npx shadow-sniper status --contract <CONTRACT_ADDRESS>
```

See [QUICKSTART.md](./QUICKSTART.md) for detailed instructions.
