/**
 * Secret manager — in-memory + file-backed secret storage for crash recovery.
 *
 * @module
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { type Logger } from 'pino';

interface SecretEntry {
  readonly secret: string; // hex
  readonly roundNumber: string;
  readonly createdAt: string;
}

export class SecretManager {
  private readonly secrets = new Map<string, Uint8Array>();

  constructor(
    private readonly filePath: string,
    private readonly logger: Logger,
  ) {
    this.loadFromDisk();
  }

  /**
   * Store a secret for a round.
   */
  store(roundNumber: bigint, secret: Uint8Array): void {
    const key = roundNumber.toString();
    this.secrets.set(key, secret);
    this.saveToDisk();
    this.logger.debug({ roundNumber: Number(roundNumber) }, 'Secret stored');
  }

  /**
   * Retrieve a secret for a round.
   */
  get(roundNumber: bigint): Uint8Array | undefined {
    return this.secrets.get(roundNumber.toString());
  }

  /**
   * Delete a secret after successful resolution.
   */
  delete(roundNumber: bigint): void {
    this.secrets.delete(roundNumber.toString());
    this.saveToDisk();
    this.logger.debug({ roundNumber: Number(roundNumber) }, 'Secret deleted');
  }

  /**
   * Check if we have a secret for a round.
   */
  has(roundNumber: bigint): boolean {
    return this.secrets.has(roundNumber.toString());
  }

  private loadFromDisk(): void {
    if (!existsSync(this.filePath)) return;

    try {
      const data = readFileSync(this.filePath, 'utf-8');
      const entries = JSON.parse(data) as Record<string, SecretEntry>;
      for (const [key, entry] of Object.entries(entries)) {
        this.secrets.set(key, Buffer.from(entry.secret, 'hex'));
      }
      this.logger.info(
        { count: this.secrets.size },
        'Loaded secrets from disk (crash recovery)',
      );
    } catch (e) {
      this.logger.warn({ error: e }, 'Failed to load secrets from disk');
    }
  }

  private saveToDisk(): void {
    try {
      const dir = dirname(this.filePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      const entries: Record<string, SecretEntry> = {};
      for (const [key, secret] of this.secrets) {
        entries[key] = {
          secret: Buffer.from(secret).toString('hex'),
          roundNumber: key,
          createdAt: new Date().toISOString(),
        };
      }
      writeFileSync(this.filePath, JSON.stringify(entries, null, 2), 'utf-8');
    } catch (e) {
      this.logger.error({ error: e }, 'Failed to save secrets to disk');
    }
  }
}
