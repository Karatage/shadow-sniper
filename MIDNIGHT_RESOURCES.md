# Midnight Network Resources

A reference guide for building on the Midnight Network — a data-protection blockchain platform built as a Layer 2 on Cardano.

## What is Midnight?

Midnight is a privacy-focused blockchain that uses zero-knowledge proofs (zk-SNARKs) to enable selective disclosure — proving facts about data without exposing the underlying information. It is designed for building DApps where sensitive data must remain private while still being verifiable on-chain.

### Key Characteristics

- **Dual State System**: Public state (on-chain, visible to all) and private state (encrypted, stored locally by users)
- **Zero-Knowledge Proofs**: zk-SNARKs generate ~128 byte proofs regardless of computational complexity, validated in milliseconds
- **Compact Language**: TypeScript-based DSL for writing smart contracts that compile to ZK circuits
- **Proof-of-Stake Consensus**: Validators participate permissionlessly through stake delegation
- **Native Cardano Bridge**: Asset transfers between Midnight and Cardano
- **Testnet block time**: 6 seconds, finality ~18 seconds

### Use Cases

- Privacy-preserving games and applications
- Healthcare and regulated data sharing
- Financial compliance without exposing sensitive data
- Governance and private voting
- AI and data analysis on encrypted inputs

---

## Documentation Links

### Getting Started

| Resource | URL | Description |
|----------|-----|-------------|
| Docs Home | https://docs.midnight.network/ | Main documentation portal |
| Installation | https://docs.midnight.network/getting-started/installation | Lace wallet, Compact compiler, proof server, VS Code extension |
| Create an App | https://docs.midnight.network/getting-started/create-mn-app | `npx create-mn-app` scaffolding tool |
| Deploy an App | https://docs.midnight.network/getting-started/deploy-mn-app | Publishing contracts to the network |
| Interact with an App | https://docs.midnight.network/getting-started/interact-with-mn-app | Using deployed DApps |

### Learning

| Resource | URL | Description |
|----------|-----|-------------|
| What is Midnight | https://docs.midnight.network/learn/what-is-midnight | Architecture overview, dual state, ZK proofs |
| How Midnight Works | https://docs.midnight.network/develop/how-midnight-works | Technical architecture and transaction model |
| Glossary | https://docs.midnight.network/learn/glossary | 57 terms covering all Midnight concepts |
| FAQ | https://docs.midnight.network/develop/faq | Common questions, limitations, troubleshooting |

### Compact Language (Smart Contracts)

| Resource | URL | Description |
|----------|-----|-------------|
| Compact Overview | https://docs.midnight.network/compact | Language home page |
| Writing a Contract | https://docs.midnight.network/compact/writing | Tutorial walkthrough with code examples |
| Language Reference | https://docs.midnight.network/compact/lang-ref | Complete syntax, types, operators, statements |
| Formal Grammar | https://docs.midnight.network/compact/compact-grammar | BNF-style grammar specification |
| Ledger Data Types | https://docs.midnight.network/compact/ledger-adt | Cell, Counter, Set, Map, List, MerkleTree APIs |
| Opaque Data Types | https://docs.midnight.network/compact/opaque_data | Opaque value handling |
| Explicit Disclosure | https://docs.midnight.network/compact/explicit_disclosure | Privacy control with `disclose()` |
| Standard Library | https://docs.midnight.network/compact/compact-std-library | Hashing, crypto, coin management, time functions |

### Tutorials

| Resource | URL | Description |
|----------|-----|-------------|
| Build Using Examples | https://docs.midnight.network/develop/tutorial/building | Counter DApp — compile, deploy, run |
| Counter Contract Details | https://docs.midnight.network/develop/tutorial/building/contract-details | Compact contract anatomy |
| Counter DApp Details | https://docs.midnight.network/develop/tutorial/building/dapp-details | TypeScript integration, providers, wallet |
| Examples Repository | https://docs.midnight.network/develop/tutorial/building/examples-repo | Official example code |
| Build from Scratch | https://docs.midnight.network/develop/tutorial/creating | Bulletin board DApp — public + private state |
| Bulletin Board Scenario | https://docs.midnight.network/develop/tutorial/creating/scenario | Requirements and design rationale |
| Bulletin Board Contract | https://docs.midnight.network/develop/tutorial/creating/bboard-contract | Full Compact contract with witnesses |
| Bulletin Board DApp | https://docs.midnight.network/develop/tutorial/creating/bboard-dapp | TypeScript DApp implementation |
| Local Testing | https://docs.midnight.network/develop/tutorial/creating/local-testing | Disconnected node for development |
| DApp Updatability | https://docs.midnight.network/develop/tutorial/creating/updatability | Managing deployed app updates |

### API References

| Resource | URL | Description |
|----------|-----|-------------|
| API Reference Index | https://docs.midnight.network/develop/reference/midnight-api | All API docs |
| Compact Runtime API | — | Compact runtime operations |
| DApp Connector API | — | Connecting DApps to Midnight |
| Ledger API | — | Ledger interactions and data |
| Midnight JS API | — | JavaScript/TypeScript library |
| On-Chain Runtime API | — | On-chain execution |
| Indexer API | — | Blockchain data queries |
| Wallet API | — | Wallet operations |
| ZSwap API | — | Privacy-preserving token swaps |
| SDKs | https://docs.midnight.network/sdks | Development kits |

### Operations & Tools

| Resource | URL | Description |
|----------|-----|-------------|
| Node Operations | https://docs.midnight.network/operate/node-intro | Running Midnight nodes |
| Tools (VS Code, CLI) | https://docs.midnight.network/compact/reference/tools | Developer tooling |
| Build with MeshSDK | https://docs.midnight.network/develop/tools/build-using-meshsdk | Cardano integration library |
| Release Notes | https://docs.midnight.network/relnotes/overview | Version history |
| Dev Diaries | https://docs.midnight.network/blog | Developer blog posts |

### Community

| Resource | URL | Description |
|----------|-----|-------------|
| Midnight Website | https://midnight.network/ | Official site |
| Discord | https://discord.com/invite/midnightnetwork | Developer community |
| Test Faucet | https://midnight.network/test-faucet/ | Get tDUST test tokens |

---

## Development Environment

### Prerequisites

- **OS**: Linux, macOS, or Windows (WSL)
- **Node.js**: v20+ (via NVM recommended)
- **Google Chrome**: Required for Lace wallet extension
- **Docker Desktop**: Required for proof server
- **Disk Space**: 2GB+ free

### Quick Setup

```bash
# 1. Install Compact compiler
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/download/compact-v0.2.0/compact-installer.sh | sh
export PATH="$HOME/.compact/bin:$PATH"
compact --version

# 2. Run proof server (Docker)
docker run -p 6300:6300 midnightnetwork/proof-server -- midnight-proof-server --network testnet

# 3. Scaffold a new app
npx create-mn-app my-app
cd my-app
npm run setup

# 4. Compile a contract
compact compile contracts/my-contract.compact contracts/managed/my-contract
```

### Available Templates

- **Hello World** — message storage
- **Counter DApp** — increment/decrement with ZK proofs
- **Bulletin Board** — public + private state example
- *Coming soon*: DEX, Midnight Kitties

---

## Compact Language Quick Reference

### Contract Structure

```compact
pragma language_version 0.18;
import CompactStandardLibrary;

// Custom types
enum State { UNSET, SET }

struct Player {
  name: Bytes<32>;
  score: Uint<64>;
}

// Public on-chain state
export ledger owner: Bytes<32>;
export ledger value: Uint<64>;
export ledger state: State;
export ledger round: Counter;

// Private state (implemented in TypeScript)
witness secretKey(): Bytes<32>;

// Constructor (called on deploy)
constructor(initialValue: Uint<64>) {
  value = initialValue;
  state = State.UNSET;
}

// Public callable circuit
export circuit get(): Uint<64> {
  assert(state == State.SET, "Value not set");
  return value;
}

// Circuit with private data + disclosure
export circuit set(newValue: Uint<64>): [] {
  const key = secretKey();
  const hash = disclose(persistentHash(key));
  assert(hash == owner, "Not authorized");
  value = newValue;
  state = State.SET;
  round += 1;
}
```

### Type System

| Type | Description | Default | TypeScript |
|------|-------------|---------|------------|
| `Boolean` | true/false | `false` | `boolean` |
| `Field` | Prime field scalar | `0` | `bigint` |
| `Uint<0..n>` | Bounded unsigned int | `0` | `bigint` |
| `Uint<n>` | n-bit unsigned int | `0` | `bigint` |
| `Bytes<n>` | Byte array of length n | all zeros | `Uint8Array` |
| `Opaque<"string">` | Opaque string | empty string | `string` |
| `Vector<n, T>` | Homogeneous n-tuple | element defaults | `T[]` |
| `[T1, T2, ...]` | Heterogeneous tuple | element defaults | `[T1, T2, ...]` |
| `struct` | Named fields | field defaults | `{ field: T }` |
| `enum` | Named variants | first variant | `number` |

### Ledger Data Types (ADTs)

| Type | Key Methods | Use Case |
|------|-------------|----------|
| `Cell<T>` | `read()`, `write(v)`, `resetToDefault()` | Single mutable value |
| `Counter` | `read()`, `increment(n)`, `decrement(n)`, `lessThan(n)` | Numeric counter (max `Uint<64>`) |
| `Set<T>` | `insert(v)`, `remove(v)`, `member(v)`, `size()`, `isEmpty()` | Unique value collection |
| `Map<K,V>` | `insert(k,v)`, `lookup(k)`, `member(k)`, `remove(k)`, `size()` | Key-value store |
| `List<T>` | `pushFront(v)`, `popFront()`, `head()`, `length()`, `isEmpty()` | Ordered front-access list |
| `MerkleTree<n,T>` | `insert(v)`, `checkRoot(rt)`, `isFull()` | Bounded tree (depth 2-32) |
| `HistoricMerkleTree<n,T>` | All MerkleTree + `resetHistory()` | Tree with root history |

### Standard Library Highlights

```compact
import CompactStandardLibrary;

// Hashing
persistentHash(data)          // Bytes<32> — for ledger storage
transientHash(data)           // Field — for non-state use
persistentCommit(data, nonce) // Commitment with nonce (never reuse nonces!)
transientCommit(data, nonce)

// Elliptic curve
ecAdd(p1, p2)                // Add curve points
ecMul(scalar, point)         // Scalar multiplication
ecMulGenerator(scalar)       // Generator point multiplication
hashToCurve(data)            // Map to curve point

// Token management
nativeToken()                // Network's native token (tDUST on testnet)
mintToken(amount, type)      // Create new tokens
send(coin, recipient)        // Transfer coin
receive(coin)                // Accept incoming coin
mergeCoin(c1, c2)            // Combine coins
ownPublicKey()               // Current user's public key

// Time
blockTimeLt(timestamp)       // Block time comparisons
blockTimeGte(timestamp)
blockTimeGt(timestamp)
blockTimeLte(timestamp)

// Option types
some(value)                  // Wrap in Maybe
none()                       // Empty Maybe
left(value)                  // Either error case
right(value)                 // Either success case
```

### Key Language Features

- **`export`**: Makes circuits callable from TypeScript and types visible in generated code
- **`witness`**: Declares private state functions (implemented in TypeScript, not on-chain)
- **`disclose()`**: Required wrapper when writing private data to public ledger — compiler enforces this
- **`assert(condition, "message")`**: Aborts transaction if condition is false
- **`pure`**: Marks circuits with no ledger or witness access (cheaper to execute)
- **`sealed`**: Ledger fields only modifiable in constructor
- **`kernel.self()`**: Returns current contract address
- **`default<T>`**: Returns the default value for any type

### Operators

- Arithmetic: `+`, `-`, `*`
- Comparison: `==`, `!=`, `<`, `>`, `<=`, `>=`
- Logical: `&&`, `||`, `!` (short-circuit)
- Type cast: `expr as Type`
- Ternary: `cond ? a : b`
- Collection: `map(f, vec)`, `fold(f, init, vec)`

---

## DApp Architecture

### Two-Project Structure

```
my-dapp/
├── contract/               # Compact contract + witnesses + tests
│   ├── src/
│   │   └── my-contract.compact
│   └── src/managed/        # Generated artifacts (do not edit)
│       └── my-contract/
│           └── contract/
│               └── index.d.cts   # Generated TypeScript types
└── app/                    # TypeScript application (CLI or web)
    └── src/
        ├── config.ts       # Network configuration
        ├── common-types.ts # Pre-instantiated generated types
        └── index.ts        # Entry point
```

### Providers Pattern

DApps connect to the network through three providers:

- **Wallet Provider**: Supplies public key and transaction-balancing logic
- **Midnight Provider**: Handles transaction submission to the network
- **Public Data Provider**: Queries blockchain state via the Indexer

### Key DApp Patterns

```typescript
// Compile-generated types are parameterized over private state T
type Circuits<T> = { increment: () => CircuitResults<T, void> }
type Ledger = { round: bigint }
type Witnesses<T> = { secretKey: () => Bytes }

// Deploy a new contract
const contract = await Contract.deploy(witnesses, providers);

// Join an existing contract
const contract = await Contract.join(address, witnesses, providers);

// Call a circuit (creates + submits transaction)
await contract.callTx.increment();

// Read ledger state
const state = contract.ledger;
```

### Wallet Integration

- Uses **Lace wallet** Chrome extension (Midnight preview version)
- Wallet created via `WalletBuilder.build()` with indexer, node, and proof server references
- Test tokens (tDUST) obtained from faucet: https://midnight.network/test-faucet/
- Uses RxJS observables for balance and sync state monitoring

---

## Key Concepts for Game Development

### Privacy Model

- **What's public**: Ledger state, transaction proofs, contract code
- **What's private**: Witness data, intermediate computations, user secrets
- **Selective disclosure**: Use `disclose()` to intentionally reveal specific private data
- **Linkability prevention**: Use `round` counters or nonces to prevent correlating transactions to a single user

### Token System

- **Native token**: tDUST (testnet) / DUST (mainnet)
- **Custom tokens**: Fungible and non-fungible tokens managed by ledger
- **Minting**: `mintToken(amount, type)` in Compact
- **Shielded transfers**: Wallet addresses and amounts remain private via ZSwap

### Limitations (Current Testnet)

- No contract-to-contract calls within circuits (yet)
- No oracle support (no external data feeds)
- Solidity code cannot be reused — must use Compact
- No white paper exists; see the "Kachina" research paper for cryptographic foundations
- Gas fee structure may change before mainnet

### Architecture Considerations for Games

- **Public state** (ledger): Game rules, scores, board state, token balances
- **Private state** (witnesses): Player secrets, hidden hands, fog-of-war data
- **ZK proofs**: Prove valid moves without revealing strategy
- **Tokens**: In-game currencies, NFT items, staking mechanics
- **Block time**: ~6 seconds per block, ~18 seconds to finality
