/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import {
  ENVELOPE_AUTH_TAG_BYTES,
  ENVELOPE_CIPHER_ALGORITHM,
  ENVELOPE_IV_BYTES,
  ENVELOPE_KEY_BYTES,
} from './envelope-cipher.constant';

export type EncryptEnvelopeParams = {
  readonly plaintext: Uint8Array;
  readonly key: Uint8Array;
};

export type DecryptEnvelopeParams = {
  readonly envelope: Uint8Array;
  readonly key: Uint8Array;
};

export type CreateEnvelopeCipherParams = {
  /**
   * Marca o comeco do arquivo. Quem achar o objeto daqui a um ano precisa saber
   * o que ele e' antes de tentar abrir, e envelopes de propositos diferentes
   * nunca devem ser confundidos entre si.
   */
  readonly magic: string;
  /** Nome da variavel de ambiente, so para a mensagem de erro ser acionavel. */
  readonly keyVariable: string;
  /**
   * O erro e' do DOMINIO de quem chama (`code-standart.md` §7): nunca lancar
   * `AppError` direto, e nunca fazer o backup lancar erro de midia.
   */
  readonly onKeyInvalid: (message: string) => Error;
  readonly onEnvelopeInvalid: (message: string) => Error;
};

export type EnvelopeCipher = {
  readKey(encodedKey: string): Buffer;
  encrypt(params: EncryptEnvelopeParams): Uint8Array;
  decrypt(params: DecryptEnvelopeParams): Uint8Array;
};

/**
 * `magica | iv | etiqueta | cifrado`.
 *
 * O envelope nasceu no modulo `Backup` e agora tem um segundo dono, o exame do
 * filho. Duplicar as 60 linhas seria o modo classico de errar deste projeto: as
 * copias concordam ate a primeira edicao, e a edicao que importa aqui e' de
 * criptografia (`code-standart.md` §16 — achou 2+, extrair antes de continuar).
 *
 * O que NAO se compartilha e' a chave: cada proposito le a sua propria variavel,
 * porque uma chave que abre o backup e o exame transforma dois cofres em um.
 */
export function createEnvelopeCipher(params: CreateEnvelopeCipherParams): EnvelopeCipher {
  const { magic, keyVariable, onKeyInvalid, onEnvelopeInvalid } = params;

  const magicBytes = Buffer.from(magic, 'utf8');
  const ivOffset = magicBytes.byteLength;
  const tagOffset = ivOffset + ENVELOPE_IV_BYTES;
  const ciphertextOffset = tagOffset + ENVELOPE_AUTH_TAG_BYTES;

  return {
    readKey(encodedKey) {
      if (encodedKey.length === 0) {
        throw onKeyInvalid(`${keyVariable} ausente — sem chave nao ha como cifrar`);
      }

      const key = Buffer.from(encodedKey, 'base64');

      if (key.byteLength !== ENVELOPE_KEY_BYTES) {
        throw onKeyInvalid(
          `${keyVariable} precisa ter ${ENVELOPE_KEY_BYTES} bytes em base64, e tem ${key.byteLength}`,
        );
      }

      return key;
    },

    encrypt({ plaintext, key }) {
      const iv = randomBytes(ENVELOPE_IV_BYTES);
      const cipher = createCipheriv(ENVELOPE_CIPHER_ALGORITHM, key, iv);
      const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);

      return Buffer.concat([magicBytes, iv, cipher.getAuthTag(), ciphertext]);
    },

    decrypt({ envelope, key }) {
      const bytes = Buffer.from(envelope);

      if (
        bytes.byteLength < ciphertextOffset ||
        !bytes.subarray(0, ivOffset).equals(magicBytes)
      ) {
        throw onEnvelopeInvalid('o arquivo nao e um envelope do Pai Presente');
      }

      const decipher = createDecipheriv(
        ENVELOPE_CIPHER_ALGORITHM,
        key,
        bytes.subarray(ivOffset, tagOffset),
      );
      decipher.setAuthTag(bytes.subarray(tagOffset, ciphertextOffset));

      return Buffer.concat([decipher.update(bytes.subarray(ciphertextOffset)), decipher.final()]);
    },
  };
}
