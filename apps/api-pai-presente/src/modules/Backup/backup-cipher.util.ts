/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import {
  BACKUP_AUTH_TAG_BYTES,
  BACKUP_CIPHER_ALGORITHM,
  BACKUP_ENVELOPE_MAGIC,
  BACKUP_IV_BYTES,
  BACKUP_KEY_BYTES,
  BACKUP_KEY_VARIABLE,
} from './backup.constant';
import { BackupEnvelopeInvalidError, BackupKeyInvalidError } from './backup.error';

const MAGIC_BYTES = Buffer.from(BACKUP_ENVELOPE_MAGIC, 'utf8');
const IV_OFFSET = MAGIC_BYTES.byteLength;
const TAG_OFFSET = IV_OFFSET + BACKUP_IV_BYTES;
const CIPHERTEXT_OFFSET = TAG_OFFSET + BACKUP_AUTH_TAG_BYTES;

export type EncryptBackupParams = {
  readonly plaintext: Uint8Array;
  readonly key: Uint8Array;
};

export type DecryptBackupParams = {
  readonly envelope: Uint8Array;
  readonly key: Uint8Array;
};

/**
 * A chave mora no ambiente, FORA do balde (`security.md` §5) — quem roubasse o
 * balde levaria envelope e chave juntos, e o backup teria sido teatro.
 */
export function readBackupKey(encodedKey: string): Buffer {
  if (encodedKey.length === 0) {
    throw new BackupKeyInvalidError(`${BACKUP_KEY_VARIABLE} ausente — sem chave nao ha backup`);
  }

  const key = Buffer.from(encodedKey, 'base64');

  if (key.byteLength !== BACKUP_KEY_BYTES) {
    throw new BackupKeyInvalidError(
      `${BACKUP_KEY_VARIABLE} precisa ter ${BACKUP_KEY_BYTES} bytes em base64, e tem ${key.byteLength}`,
    );
  }

  return key;
}

/** `magica | iv | etiqueta | cifrado` — tudo o que o restore precisa, e nada mais. */
export function encryptBackup({ plaintext, key }: EncryptBackupParams): Uint8Array {
  const iv = randomBytes(BACKUP_IV_BYTES);
  const cipher = createCipheriv(BACKUP_CIPHER_ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);

  return Buffer.concat([MAGIC_BYTES, iv, cipher.getAuthTag(), ciphertext]);
}

export function decryptBackup({ envelope, key }: DecryptBackupParams): Uint8Array {
  const bytes = Buffer.from(envelope);

  if (bytes.byteLength < CIPHERTEXT_OFFSET || !bytes.subarray(0, IV_OFFSET).equals(MAGIC_BYTES)) {
    throw new BackupEnvelopeInvalidError('o arquivo nao e um envelope de backup do Pai Presente');
  }

  const decipher = createDecipheriv(
    BACKUP_CIPHER_ALGORITHM,
    key,
    bytes.subarray(IV_OFFSET, TAG_OFFSET),
  );
  decipher.setAuthTag(bytes.subarray(TAG_OFFSET, CIPHERTEXT_OFFSET));

  return Buffer.concat([decipher.update(bytes.subarray(CIPHERTEXT_OFFSET)), decipher.final()]);
}
