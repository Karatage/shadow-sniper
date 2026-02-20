#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Stopping Midnight standalone environment..."
docker compose -f "$SCRIPT_DIR/docker/standalone.yml" -p shadow-sniper down

echo "Done."
