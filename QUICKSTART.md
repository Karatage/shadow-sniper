# ShadowSniper Quick Start Guide

Get ShadowSniper running locally in minutes.

## Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose (for local Midnight node)
- Git

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Karatage/shadow-sniper.git
   cd shadow-sniper
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

## Local Development Setup

### Step 1: Start Local Midnight Node

```bash
cd docker
docker-compose up -d
```

Wait for services to be healthy (check with `docker-compose ps`).

### Step 2: Install Compact Compiler

Follow [Midnight's Compact documentation](https://docs.midnight.network/compact) to install the compiler.

### Step 3: Compile Contract

```bash
npm run compile:contract
```

This generates TypeScript bindings in `contract/managed/`.

### Step 4: Deploy Contract

```bash
npx shadow-sniper deploy --operator <YOUR_WALLET_ADDRESS>
```

Save the contract address from the output.

### Step 5: Test the Game

```bash
# Start a round (operator)
npx shadow-sniper start-round --contract <CONTRACT_ADDRESS>
# Save the secret that's printed!

# Place bets (as different players)
npx shadow-sniper bet --contract <CONTRACT_ADDRESS> --amount 1000

# Check status
npx shadow-sniper status --contract <CONTRACT_ADDRESS>

# Wait 5 minutes for round to end...

# Resolve round (operator)
npx shadow-sniper resolve --contract <CONTRACT_ADDRESS> --secret <SECRET>

# Check results
npx shadow-sniper status --contract <CONTRACT_ADDRESS>
```

## CLI Commands

### Deploy
```bash
shadow-sniper deploy --operator <ADDRESS> [options]
```

**Options:**
- `--min-bet <amount>` - Minimum bet (default: 100 NIGHT)
- `--max-bet <amount>` - Maximum bet (default: 10000 NIGHT)
- `--round-duration <ms>` - Round duration (default: 300000 = 5 min)
- `--house-fee <percent>` - House fee % (default: 3)
- `--progressive <percent>` - Progressive % (default: 1)
- `--progressive-trigger <percent>` - Jackpot trigger % (default: 1)

### Start Round
```bash
shadow-sniper start-round --contract <ADDRESS> [--secret <HEX>]
```

Operator starts a new round. If `--secret` is not provided, a random one is generated.

**⚠️ CRITICAL:** Save the secret! You need it to resolve the round.

### Place Bet
```bash
shadow-sniper bet --contract <ADDRESS> --amount <AMOUNT>
```

Place a bet in the current round.

### Check Status
```bash
shadow-sniper status --contract <ADDRESS>
```

View game state, current round, bets, and last result.

### Resolve Round
```bash
shadow-sniper resolve --contract <ADDRESS> --secret <HEX>
```

Operator reveals secret to select winners and pay out.

### Cancel Round
```bash
shadow-sniper cancel --contract <ADDRESS>
```

Anyone can call this after the resolve deadline passes if operator fails to resolve. Refunds all bets.

## Game Mechanics

### Main Pot Winner
- **Weighted RNG**: Larger bets = higher chance to win
- **Winner gets**: Pot - house fee - progressive contribution
- Example: 1000 NIGHT bet in 5000 NIGHT pot = 20% win chance

### Progressive Jackpot
- **Equal odds**: Every player has the same chance, regardless of bet size
- **Trigger**: Configurable probability per round (default: 1%)
- **Can win both**: Main pot and progressive in same round

### Safety Features
- **One bet per round**: Immutable, can't change or add more
- **Timeout protection**: If operator fails to resolve, anyone can cancel and refund
- **Transparent**: All game data publicly disclosed on-chain

## Architecture

```
shadow-sniper/
├── contract/          # Compact smart contract
├── api/              # TypeScript API wrapper
├── cli/              # Command-line interface
├── operator/         # Automated operator service (Phase 3)
└── docker/           # Local dev stack
```

## Current Status: Phase 1 Complete ✅

- [x] Monorepo structure
- [x] Compact contract with full game logic
- [x] TypeScript API wrapper
- [x] CLI with all commands
- [x] Docker local dev stack

### Next: Phase 2 - Token Integration

- [ ] Wire up `receive()` / `send()` for NIGHT tokens
- [ ] Implement `withdrawHouseFees()` token flow
- [ ] Test full token lifecycle

### Future: Phase 3 - Operator Service

- [ ] Automated round management
- [ ] Deterministic secret derivation
- [ ] Health monitoring and recovery

### Future: Phase 4 - Web UI

- [ ] React app with Lace wallet integration
- [ ] Real-time round display
- [ ] Leaderboards and player profiles

## Troubleshooting

### "Compact compiler not found"

Install from [Midnight Compact docs](https://docs.midnight.network/compact).

### "Contract deployment failed"

Ensure local Midnight node is running:
```bash
cd docker && docker-compose ps
```

### "Round not open for bets"

Check round status:
```bash
shadow-sniper status --contract <ADDRESS>
```

Wait for operator to start a new round.

### "Invalid secret"

Make sure you're using the exact secret from `start-round` output.

## Documentation

- [DESIGN.md](./DESIGN.md) - Complete game design
- [PLAN.md](./PLAN.md) - Implementation plan
- [contract/README.md](./contract/README.md) - Contract details
- [docker/README.md](./docker/README.md) - Docker setup

## Community

- [Midnight Discord](https://discord.gg/midnight)
- [GitHub Issues](https://github.com/Karatage/shadow-sniper/issues)

## License

MIT
