/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { createEnvelopeCipher } from '../shared/crypto/envelope-cipher';

import { BACKUP_ENVELOPE_MAGIC, BACKUP_KEY_VARIABLE } from './backup.constant';
import { BackupEnvelopeInvalidError, BackupKeyInvalidError } from './backup.error';

/**
 * A mecanica do envelope mora em `shared/crypto` desde que ganhou um segundo
 * dono (o exame do filho). O que fica aqui e' o que e' do BACKUP: a magica do
 * arquivo, a variavel da chave e os erros do dominio — nunca `AppError` direto
 * (`code-standart.md` §7).
 */
const cipher = createEnvelopeCipher({
  magic: BACKUP_ENVELOPE_MAGIC,
  keyVariable: BACKUP_KEY_VARIABLE,
  onKeyInvalid: (message) => new BackupKeyInvalidError(message),
  onEnvelopeInvalid: () =>
    new BackupEnvelopeInvalidError('o arquivo nao e um envelope de backup do Pai Presente'),
});

export type EncryptBackupParams = {
  readonly plaintext: Uint8Array;
  readonly key: Uint8Array;
};

export type DecryptBackupParams = {
  readonly envelope: Uint8Array;
  readonly key: Uint8Array;
};

export function readBackupKey(encodedKey: string): Buffer {
  return cipher.readKey(encodedKey);
}

/** `magica | iv | etiqueta | cifrado` — tudo o que o restore precisa, e nada mais. */
export function encryptBackup(params: EncryptBackupParams): Uint8Array {
  return cipher.encrypt(params);
}

export function decryptBackup(params: DecryptBackupParams): Uint8Array {
  return cipher.decrypt(params);
}
