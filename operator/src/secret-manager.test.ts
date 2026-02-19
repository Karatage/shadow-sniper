import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SecretManager } from './secret-manager.js';
import { existsSync, unlinkSync } from 'node:fs';

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
} as any;

describe('SecretManager', () => {
  const testPath = `/tmp/test-secret-manager-${Date.now()}.json`;

  afterEach(() => {
    if (existsSync(testPath)) {
      unlinkSync(testPath);
    }
  });

  it('should store and retrieve secrets', () => {
    const manager = new SecretManager(testPath, mockLogger);
    const secret = new Uint8Array(32).fill(0xAA);

    manager.store(1n, secret);
    const retrieved = manager.get(1n);

    expect(retrieved).toBeDefined();
    expect(Buffer.from(retrieved!)).toEqual(Buffer.from(secret));
  });

  it('should return undefined for unknown rounds', () => {
    const manager = new SecretManager(testPath, mockLogger);
    expect(manager.get(999n)).toBeUndefined();
  });

  it('should delete secrets', () => {
    const manager = new SecretManager(testPath, mockLogger);
    const secret = new Uint8Array(32).fill(0xBB);

    manager.store(1n, secret);
    expect(manager.has(1n)).toBe(true);

    manager.delete(1n);
    expect(manager.has(1n)).toBe(false);
    expect(manager.get(1n)).toBeUndefined();
  });

  it('should persist to disk for crash recovery', () => {
    const secret = new Uint8Array(32).fill(0xCC);

    // Store with first instance
    const manager1 = new SecretManager(testPath, mockLogger);
    manager1.store(5n, secret);

    // Load with new instance (simulating restart)
    const manager2 = new SecretManager(testPath, mockLogger);
    const retrieved = manager2.get(5n);

    expect(retrieved).toBeDefined();
    expect(Buffer.from(retrieved!)).toEqual(Buffer.from(secret));
  });

  it('should handle multiple secrets', () => {
    const manager = new SecretManager(testPath, mockLogger);

    manager.store(1n, new Uint8Array(32).fill(0x01));
    manager.store(2n, new Uint8Array(32).fill(0x02));
    manager.store(3n, new Uint8Array(32).fill(0x03));

    expect(manager.has(1n)).toBe(true);
    expect(manager.has(2n)).toBe(true);
    expect(manager.has(3n)).toBe(true);

    expect(manager.get(1n)![0]).toBe(0x01);
    expect(manager.get(2n)![0]).toBe(0x02);
    expect(manager.get(3n)![0]).toBe(0x03);
  });

  it('should handle empty file gracefully', () => {
    // Creating without any prior file should work fine
    const manager = new SecretManager(testPath, mockLogger);
    expect(manager.has(1n)).toBe(false);
  });

  it('should overwrite existing secrets for same round', () => {
    const manager = new SecretManager(testPath, mockLogger);

    manager.store(1n, new Uint8Array(32).fill(0xAA));
    manager.store(1n, new Uint8Array(32).fill(0xBB));

    const retrieved = manager.get(1n);
    expect(retrieved![0]).toBe(0xBB);
  });
});
