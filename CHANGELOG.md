# Changelog

All notable changes to ShadowSniper will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Phase 2 - Token Integration (Planned)
- Wire up NIGHT token receive()/send()
- Implement withdrawHouseFees() token flow
- Add token balance queries
- Test full token lifecycle

### Phase 3 - Operator Service (Planned)
- Automated round lifecycle management
- Deterministic secret derivation from master key
- Health monitoring and restart recovery
- Metrics and alerting

### Phase 4 - Web UI (Planned)
- React frontend application
- Lace wallet integration
- Real-time round state updates
- Progressive jackpot animations
- Leaderboards and player profiles
- Historical round browser

## [0.1.0] - 2026-02-14

### Phase 1 Complete ✅

#### Added
- **Smart Contract**: Complete Compact implementation with:
  - Round lifecycle (RESOLVED → OPEN → RESOLVING)
  - Weighted RNG for main pot winner selection
  - Equal-odds progressive jackpot
  - Operator commit-reveal RNG scheme
  - Safety valve for operator timeout (automatic refunds)
  - Configurable game parameters
  - Edge case handling (0 players, 1 player refund, max players)

- **API Wrapper**: TypeScript API for contract interaction:
  - ShadowSniperAPI class with all contract methods
  - Type definitions for all game entities
  - RNG utilities (commitment generation, verification, secret derivation)
  - Time utilities (duration formatting, deadline checking)

- **CLI Tool**: Full-featured command-line interface:
  - `deploy` - Deploy new contract
  - `start-round` - Operator starts round with commitment
  - `bet` - Player places bet
  - `status` - View game state and history
  - `resolve` - Operator reveals secret to select winners
  - `cancel` - Timeout safety valve with refunds

- **Development Stack**: Docker Compose configuration:
  - Midnight standalone node (local devnet)
  - Indexer for fast queries
  - Proof server for ZK proof generation
  - PostgreSQL database for indexer

- **Project Structure**: Monorepo with npm workspaces:
  - Turbo for build orchestration
  - TypeScript with strict mode
  - Shared configuration files
  - Workspace dependencies

- **Documentation**:
  - README with overview and quick start
  - DESIGN.md with complete game mechanics
  - PLAN.md with implementation roadmap
  - QUICKSTART.md with detailed setup guide
  - CONTRIBUTING.md for contributors
  - Contract README with technical details
  - Docker README for local development

#### Technical Details
- Compact smart contract: `contract/src/shadow_sniper.compact`
- Max players per round: 100
- Default round duration: 5 minutes (configurable)
- Default house fee: 3% (configurable)
- Default progressive contribution: 1% (configurable)
- Default progressive trigger: 1% chance (configurable)
- Full transparency: All game data publicly disclosed

#### Known Limitations
- Token integration stubbed (Phase 2)
- Midnight SDK packages not yet publicly available
- Compact compiler not included (install separately)
- Contract unit tests not yet implemented
- No integration tests yet

### Changed
- N/A (initial release)

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- Operator commit-reveal prevents manipulation
- Timeout protection ensures player funds safety
- Single bet per round prevents double-betting
- All inputs validated with assertions
- Full transparency for verifiability

## Future Releases

### [0.2.0] - Token Integration (Planned Q1 2026)
- Real NIGHT token flow
- Fee withdrawal
- Token balance tracking

### [0.3.0] - Operator Service (Planned Q1 2026)
- Automated operation
- Health monitoring
- Secret management

### [0.4.0] - Web UI (Planned Q2 2026)
- React application
- Wallet integration
- Leaderboards
- Real-time updates

### [1.0.0] - Production Ready (Planned Q2 2026)
- Full security audit
- Testnet deployment
- Load testing
- Performance optimization
- Mainnet deployment on Midnight Kukolu
