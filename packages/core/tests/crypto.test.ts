import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  decryptSecret,
  encryptSecret,
  parseEncryptedSecret,
  serializeEncryptedSecret,
} from '../src/crypto/encryption.ts';

describe('secret encryption', () => {
  it('round-trips provider secrets with AES-256-GCM', () => {
    const key = randomBytes(32).toString('base64');
    const encrypted = encryptSecret('sk-test-value', key);

    expect(encrypted.ciphertextBase64).not.toContain('sk-test-value');
    expect(decryptSecret(encrypted, key)).toBe('sk-test-value');
  });

  it('rejects keys that are not 32 bytes', () => {
    expect(() => encryptSecret('secret', randomBytes(16).toString('base64'))).toThrow(/32 bytes/);
  });

  it('serializes and parses encrypted payloads', () => {
    const key = randomBytes(32).toString('base64');
    const encrypted = encryptSecret('secret', key);
    const parsed = parseEncryptedSecret(serializeEncryptedSecret(encrypted));

    expect(decryptSecret(parsed, key)).toBe('secret');
  });
});
