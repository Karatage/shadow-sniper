/**
 * File-backed secret persistence for ShadowSniper operator.
 * Stores secrets at ~/.shadow-sniper/secrets.json, keyed by contract+round.
 *
 * @module
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const STORE_DIR = join(homedir(), '.shadow-sniper');
const STORE_FILE = join(STORE_DIR, 'secrets.json');

interface SecretEntry {
  readonly secret: string; // hex-encoded
  readonly roundNumber: number;
  readonly createdAt: string;
}

type SecretStore = Record<string, SecretEntry>;

function ensureStoreDir(): void {
  if (!existsSync(STORE_DIR)) {
    mkdirSync(STORE_DIR, { recursive: true });
  }
}

function loadStore(): SecretStore {
  ensureStoreDir();
  if (!existsSync(STORE_FILE)) {
    return {};
  }
  const data = readFileSync(STORE_FILE, 'utf-8');
  return JSON.parse(data) as SecretStore;
}

function saveStore(store: SecretStore): void {
  ensureStoreDir();
  writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

function makeKey(contractAddress: string, roundNumber: bigint): string {
  return `${contractAddress}:${roundNumber}`;
}

/**
 * Store a secret for a specific contract + round.
 */
export function storeSecret(
  contractAddress: string,
  roundNumber: bigint,
  secret: Uint8Array,
): void {
  const store = loadStore();
  const key = makeKey(contractAddress, roundNumber);
  store[key] = {
    secret: Buffer.from(secret).toString('hex'),
    roundNumber: Number(roundNumber),
    createdAt: new Date().toISOString(),
  };
  saveStore(store);
}

/**
 * Retrieve a stored secret for a specific contract + round.
 * Returns null if not found.
 */
export function retrieveSecret(
  contractAddress: string,
  roundNumber: bigint,
): Uint8Array | null {
  const store = loadStore();
  const key = makeKey(contractAddress, roundNumber);
  const entry = store[key];
  if (!entry) return null;
  return Buffer.from(entry.secret, 'hex');
}

/**
 * Delete a stored secret after successful resolve.
 */
export function deleteSecret(
  contractAddress: string,
  roundNumber: bigint,
): void {
  const store = loadStore();
  const key = makeKey(contractAddress, roundNumber);
  delete store[key];
  saveStore(store);
}

/**
 * List all stored secrets (for debugging).
 */
export function listSecrets(): Array<{
  contractAddress: string;
  roundNumber: number;
  createdAt: string;
}> {
  const store = loadStore();
  return Object.entries(store).map(([key, entry]) => {
    const [contractAddress] = key.split(':');
    return {
      contractAddress,
      roundNumber: entry.roundNumber,
      createdAt: entry.createdAt,
    };
  });
}
