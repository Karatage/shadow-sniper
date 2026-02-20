#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting Midnight standalone environment..."
docker compose -f "$SCRIPT_DIR/docker/standalone.yml" -p shadow-sniper up -d

echo ""
echo "Waiting for services to become healthy..."
docker compose -f "$SCRIPT_DIR/docker/standalone.yml" -p shadow-sniper ps

echo ""
echo "Services:"
echo "  Node RPC (Tailscale):    ws://0.0.0.0:9944"
echo "  Indexer GraphQL (Tailscale): http://0.0.0.0:8088"
echo "  Proof Server (local only):   http://127.0.0.1:6300"
echo ""
echo "GraphQL Playground: http://localhost:8088"
echo ""
echo "Run ./stop.sh to tear down."
