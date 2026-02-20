# Local Development Environment

Midnight Network standalone environment for ShadowSniper development.

## Prerequisites

- Docker Desktop running
- Ports 9944, 8088, and 6300 available

## Start / Stop

```bash
# Start all services
./start.sh

# Stop all services
./stop.sh

# View logs
docker compose -f docker/standalone.yml -p shadow-sniper logs -f

# View logs for a specific service
docker compose -f docker/standalone.yml -p shadow-sniper logs -f node
docker compose -f docker/standalone.yml -p shadow-sniper logs -f indexer
docker compose -f docker/standalone.yml -p shadow-sniper logs -f proof-server

# Check health status
docker compose -f docker/standalone.yml -p shadow-sniper ps
```

## Service URLs

### From this machine (localhost)

| Service | URL | Purpose |
|---------|-----|---------|
| Node RPC | `ws://localhost:9944` | WebSocket RPC for submitting transactions |
| Node Health | `http://localhost:9944/health` | Node health check |
| Indexer GraphQL | `http://localhost:8088` | GraphQL API + Playground |
| Proof Server | `http://localhost:6300` | ZK proof generation |

### From another device on Tailscale

Replace `<tailscale-ip>` with this machine's Tailscale IP (run `tailscale ip -4` to find it).

| Service | URL | Purpose |
|---------|-----|---------|
| Node RPC | `ws://<tailscale-ip>:9944` | WebSocket RPC |
| Indexer GraphQL | `http://<tailscale-ip>:8088` | GraphQL API + Playground |
| Proof Server | **Not exposed** | Handles private ZK data — localhost only |

## GraphQL API

The indexer GraphQL endpoint is at `/api/v3/graphql`. There is no built-in playground UI — use a GraphQL client or curl.

**From a browser/client**, point at: `http://localhost:8088/api/v3/graphql` (or `http://<tailscale-ip>:8088/api/v3/graphql`).

**From curl:**

```bash
curl -s http://localhost:8088/api/v3/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query": "{ block { hash height timestamp } }"}'
```

### Available queries

| Query | Description |
|-------|-------------|
| `block` | Latest block (hash, height, timestamp, protocolVersion, transactions) |
| `transactions` | Transaction list (requires `offset` arg) |
| `contractAction` | Actions on a deployed contract (requires `address` arg) |

Example — latest block:

```graphql
{
  block {
    hash
    height
    timestamp
    protocolVersion
  }
}
```

## tDUST in Standalone Mode

In standalone mode (`CFG_PRESET=dev`), there is **no faucet**. Instead, the Midnight wallet SDK (v4.0.0+) creates disposable wallets that are automatically funded with tDUST when running against a standalone node. This happens transparently — just build a wallet pointing at `ws://localhost:9944` and it will have test funds.

This is the `WalletBuilder` pattern used by the operator and CLI:

```typescript
import { WalletBuilder } from '@aspect-finance/wallet-api';

const wallet = await WalletBuilder.build(
  'ws://localhost:9944',       // node
  'http://localhost:8088',     // indexer
  'http://localhost:6300',     // proof server
);
// wallet is auto-funded with tDUST in standalone mode
```

## Testnet-Remote Mode

When you're ready to move beyond local standalone to the Midnight testnet:

1. **Stop the local stack**: `./stop.sh`

2. **Run only the proof server** (still needed locally for ZK proof generation):
   ```bash
   docker run -d --name shadow-sniper-proof-server \
     -p 127.0.0.1:6300:6300 \
     midnightntwrk/proof-server:7.0.0 \
     midnight-proof-server --network testnet
   ```

3. **Update your app config** to point at the testnet:
   ```
   Node RPC:  wss://rpc.testnet.midnight.network
   Indexer:   https://indexer.testnet.midnight.network
   Proof:     http://localhost:6300
   ```

4. **Get tDUST** from the faucet: https://midnight.network/test-faucet/

5. **Install Lace wallet** Chrome extension and configure it for Midnight testnet. Set the proof server to `http://localhost:6300` in wallet settings.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Docker Compose (shadow-sniper)                          │
│                                                         │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────┐  │
│  │  Node         │   │  Indexer      │   │ Proof      │  │
│  │  (standalone) │◄──│  (standalone) │   │ Server     │  │
│  │              │   │  SQLite DB   │   │            │  │
│  │  :9944       │   │  :8088       │   │  :6300     │  │
│  │  0.0.0.0     │   │  0.0.0.0     │   │  127.0.0.1 │  │
│  └──────────────┘   └──────────────┘   └────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
         ▲                    ▲                  ▲
         │                    │                  │
    Tailscale OK         Tailscale OK       Local only
```

## Troubleshooting

**Node won't start**: Check Docker Desktop is running and port 9944 is free.

**Indexer fails to start**: The indexer waits for the node to be healthy first. Check node logs: `docker compose -f docker/standalone.yml -p shadow-sniper logs node`

**Proof server not reachable**: The proof server is bound to `127.0.0.1` only. It's not accessible from other machines by design.

**Reset all state**: Stop the stack, then remove the volume:
```bash
./stop.sh
docker volume rm shadow-sniper_indexer-data
```
