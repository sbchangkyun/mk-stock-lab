/**
 * Phase 3GG-T-HF2: application-level AES-256-GCM for the durable KIS token envelope.
 *
 * Node built-in `crypto` only (no new dependency). Random 12-byte IV per encryption. AAD binds the
 * ciphertext to a stable, NON-secret context (scopeKey|generationId|keyVersion) so a stored envelope
 * cannot be replayed under a different scope/generation. NEVER logs plaintext, ciphertext, the key,
 * key length, a token prefix/suffix, or a hash of any of these.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { KisTokenEnvelope } from './kisTokenTypes';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

export class KisTokenCryptoError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'KisTokenCryptoError';
    this.code = code;
  }
}

const buildAad = (scopeKey: string, generationId: string, keyVersion: number): Buffer =>
  Buffer.from(`${scopeKey}|${generationId}|${keyVersion}`, 'utf8');

const assertKey = (key: Buffer): void => {
  if (!Buffer.isBuffer(key) || key.length !== 32) {
    // Do not include the actual length in a way that could leak; a fixed message is enough.
    throw new KisTokenCryptoError('KIS_TOKEN_KEY_INVALID', 'Encryption key must be exactly 32 bytes.');
  }
};

export const encryptKisToken = (
  plaintextToken: string,
  ctx: { scopeKey: string; generationId: string; keyVersion: number; key: Buffer },
): KisTokenEnvelope => {
  assertKey(ctx.key);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, ctx.key, iv, { authTagLength: AUTH_TAG_BYTES });
  cipher.setAAD(buildAad(ctx.scopeKey, ctx.generationId, ctx.keyVersion));
  const ciphertext = Buffer.concat([cipher.update(plaintextToken, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    keyVersion: ctx.keyVersion,
  };
};

/**
 * Decrypt an envelope. On ANY authentication/format failure throws KisTokenCryptoError with a safe
 * code (KIS_TOKEN_DECRYPT_FAILED) — callers must fail closed and must NOT auto-issue a replacement.
 */
export const decryptKisToken = (
  envelope: KisTokenEnvelope,
  ctx: { scopeKey: string; generationId: string; key: Buffer },
): string => {
  assertKey(ctx.key);
  try {
    const iv = Buffer.from(envelope.iv, 'base64');
    const authTag = Buffer.from(envelope.authTag, 'base64');
    const ciphertext = Buffer.from(envelope.ciphertext, 'base64');
    if (iv.length !== IV_BYTES || authTag.length !== AUTH_TAG_BYTES || ciphertext.length === 0) {
      throw new KisTokenCryptoError('KIS_TOKEN_DECRYPT_FAILED', 'Malformed token envelope.');
    }
    const decipher = createDecipheriv(ALGORITHM, ctx.key, iv, { authTagLength: AUTH_TAG_BYTES });
    decipher.setAAD(buildAad(ctx.scopeKey, ctx.generationId, envelope.keyVersion));
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString('utf8');
  } catch (error) {
    if (error instanceof KisTokenCryptoError) throw error;
    throw new KisTokenCryptoError('KIS_TOKEN_DECRYPT_FAILED', 'Token decryption/authentication failed.');
  }
};
