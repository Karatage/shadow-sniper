# Docker Development Stack

Local development environment for ShadowSniper using Midnight Network standalone node.

## Services

- **midnight-node**: Local Midnight Network standalone node
- **midnight-indexer**: Indexes blockchain data for fast queries
- **proof-server**: Generates zero-knowledge proofs for transactions
- **postgres**: Database for the indexer

## Quick Start

1. **Start the stack:**
   ```bash
   cd docker
   docker-compose up -d
   ```

2. **Check service health:**
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

3. **Wait for services to be ready:**
   All services have health checks. Wait until all show as "healthy":
   ```bash
   watch docker-compose ps
   ```

4. **Stop the stack:**
   ```bash
   docker-compose down
   ```

5. **Reset everything (delete all data):**
   ```bash
   docker-compose down -v
   ```

## Service Endpoints

- **Node RPC**: http://localhost:6383
- **Node WebSocket**: ws://localhost:6384
- **Indexer API**: http://localhost:6385
- **Proof Server**: http://localhost:6386

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
# Edit .env with your settings
```

## Troubleshooting

### Services won't start

Check Docker logs for specific service:
```bash
docker-compose logs midnight-node
docker-compose logs midnight-indexer
docker-compose logs proof-server
```

### Port conflicts

If ports are already in use, edit `docker-compose.yml` to use different ports.

### Proof generation slow

Increase worker threads in `proof-server.yml`:
```yaml
proof_generation:
  workers: 8  # Increase based on your CPU cores
```

### Database issues

Reset the database:
```bash
docker-compose down -v
docker-compose up -d
```

## Development Workflow

1. **Start services:**
   ```bash
   cd docker && docker-compose up -d
   ```

2. **Deploy contract:**
   ```bash
   npm run compile:contract
   shadow-sniper deploy --operator <YOUR_ADDRESS>
   ```

3. **Test game flow:**
   ```bash
   # Start a round
   shadow-sniper start-round --contract <ADDRESS>

   # Place bets
   shadow-sniper bet --contract <ADDRESS> --amount 1000

   # Check status
   shadow-sniper status --contract <ADDRESS>

   # Resolve round
   shadow-sniper resolve --contract <ADDRESS> --secret <SECRET>
   ```

4. **View logs:**
   ```bash
   docker-compose logs -f midnight-node
   docker-compose logs -f midnight-indexer
   ```

## Performance Tips

- **Proof caching**: Enabled by default, speeds up repeated operations
- **Worker threads**: Adjust based on CPU cores (default: 4)
- **Cache size**: Increase for high-traffic testing (default: 1000)

## Limitations

- **Standalone mode**: Not connected to real network, local-only
- **No persistence**: Data reset on `docker-compose down -v`
- **Single node**: Not a realistic network topology

## Next Steps

After local testing, deploy to:
- **Midnight Preprod Testnet**: For realistic testing
- **Midnight Kukolu**: For production deployment
