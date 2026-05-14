import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const algorithm = 'aes-256-gcm';
const ivLength = 12;
const authTagLength = 16;

export type EncryptedSecret = {
  ciphertextBase64: string;
  ivBase64: string;
  authTagBase64: string;
};

const parseKey = (keyBase64: string): Buffer => {
  const key = Buffer.from(keyBase64, 'base64');

  if (key.byteLength !== 32) {
    throw new Error('Encryption key must decode to 32 bytes. Generate a new base64 key and retry.');
  }

  return key;
};

export const encryptSecret = (plaintext: string, keyBase64: string): EncryptedSecret => {
  if (!plaintext) {
    throw new Error('Secret cannot be empty. Enter a value and retry.');
  }

  const key = parseKey(keyBase64);
  const iv = randomBytes(ivLength);
  const cipher = createCipheriv(algorithm, key, iv, { authTagLength });
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertextBase64: ciphertext.toString('base64'),
    ivBase64: iv.toString('base64'),
    authTagBase64: authTag.toString('base64'),
  };
};

export const decryptSecret = (encrypted: EncryptedSecret, keyBase64: string): string => {
  const key = parseKey(keyBase64);
  const decipher = createDecipheriv(algorithm, key, Buffer.from(encrypted.ivBase64, 'base64'), {
    authTagLength,
  });
  decipher.setAuthTag(Buffer.from(encrypted.authTagBase64, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertextBase64, 'base64')),
    decipher.final(),
  ]);

  return plaintext.toString('utf8');
};

export const serializeEncryptedSecret = (encrypted: EncryptedSecret): string =>
  JSON.stringify(encrypted);

export const parseEncryptedSecret = (value: string): EncryptedSecret => {
  const parsed = JSON.parse(value) as Partial<EncryptedSecret>;

  if (!parsed.ciphertextBase64 || !parsed.ivBase64 || !parsed.authTagBase64) {
    throw new Error('Encrypted secret is malformed. Re-enter the secret and retry.');
  }

  return {
    ciphertextBase64: parsed.ciphertextBase64,
    ivBase64: parsed.ivBase64,
    authTagBase64: parsed.authTagBase64,
  };
};
