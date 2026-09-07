/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import {
  ENVELOPE_IV_BYTES,
  ENVELOPE_KEY_BYTES,
} from '../shared/crypto/envelope-cipher.constant';

import { BACKUP_ENVELOPE_MAGIC } from './backup.constant';
import { decryptBackup, encryptBackup, readBackupKey } from './backup-cipher.util';

const KEY = Buffer.alloc(ENVELOPE_KEY_BYTES, 7);
const OUTRA_KEY = Buffer.alloc(ENVELOPE_KEY_BYTES, 9);

/** O dump de verdade tem nome de crianca em quase toda linha. */
const DUMP = Buffer.from("COPY children (id, name) FROM stdin;\nc-1\tJoaquim Girassol\n\\.\n", 'utf8');

describe('a chave vem do ambiente, e nunca do balde', () => {
  test('base64 de 32 bytes vira chave', () => {
    const key = readBackupKey(KEY.toString('base64'));

    expect(key.byteLength).toBe(ENVELOPE_KEY_BYTES);
  });

  /**
   * Chave curta nao e chave: o `createCipheriv` morreria la na frente com uma
   * mensagem de biblioteca, no meio do job, depois do dump ja ter saido do banco.
   */
  test('chave de tamanho errado morre na leitura, nao no meio do job', () => {
    expect(() => readBackupKey(Buffer.alloc(16, 1).toString('base64'))).toThrow(/32 bytes/);
  });

  test('chave ausente morre dizendo o nome da variavel', () => {
    expect(() => readBackupKey('')).toThrow(/BACKUP_ENCRYPTION_KEY/);
  });
});

describe('o envelope guarda o que o decifrador precisa, e nada do conteudo', () => {
  test('ida e volta devolve os mesmos bytes', () => {
    const envelope = encryptBackup({ plaintext: DUMP, key: KEY });

    expect(Buffer.from(decryptBackup({ envelope, key: KEY }))).toEqual(DUMP);
  });

  /**
   * A prova que sustenta o `security.md` §5: o que sai daqui e o que sobe para o
   * balde, e nele nao pode haver nome de crianca legivel.
   */
  test('o texto claro nao aparece em lugar nenhum do envelope', () => {
    const envelope = Buffer.from(encryptBackup({ plaintext: DUMP, key: KEY }));

    expect(envelope.includes('Joaquim Girassol')).toBe(false);
    expect(envelope.includes('COPY children')).toBe(false);
  });

  test('o envelope se identifica, para quem restaurar saber o que tem em maos', () => {
    const envelope = Buffer.from(encryptBackup({ plaintext: DUMP, key: KEY }));

    expect(envelope.subarray(0, BACKUP_ENVELOPE_MAGIC.length).toString('utf8')).toBe(
      BACKUP_ENVELOPE_MAGIC,
    );
  });

  /** IV repetido em AES-GCM entrega o texto claro; dois backups iguais o expoem. */
  test('dois envelopes do MESMO dump nao sao iguais', () => {
    const primeiro = Buffer.from(encryptBackup({ plaintext: DUMP, key: KEY }));
    const segundo = Buffer.from(encryptBackup({ plaintext: DUMP, key: KEY }));

    expect(primeiro.equals(segundo)).toBe(false);
    expect(
      primeiro.subarray(BACKUP_ENVELOPE_MAGIC.length, BACKUP_ENVELOPE_MAGIC.length + ENVELOPE_IV_BYTES),
    ).not.toEqual(
      segundo.subarray(BACKUP_ENVELOPE_MAGIC.length, BACKUP_ENVELOPE_MAGIC.length + ENVELOPE_IV_BYTES),
    );
  });
});

describe('envelope adulterado nao restaura em silencio', () => {
  test('chave errada recusa', () => {
    const envelope = encryptBackup({ plaintext: DUMP, key: KEY });

    expect(() => decryptBackup({ envelope, key: OUTRA_KEY })).toThrow();
  });

  /**
   * Sem a etiqueta do GCM, um byte trocado no balde voltaria como dump valido e
   * torto — e o restore escreveria isso no banco sem reclamar.
   */
  test('um byte trocado no meio recusa', () => {
    const envelope = Buffer.from(encryptBackup({ plaintext: DUMP, key: KEY }));
    const posicao = envelope.byteLength - 3;
    envelope[posicao] = (envelope[posicao] ?? 0) ^ 0xff;

    expect(() => decryptBackup({ envelope, key: KEY })).toThrow();
  });

  test('arquivo que nao e envelope recusa dizendo isso', () => {
    expect(() => decryptBackup({ envelope: Buffer.from('backup.sql qualquer'), key: KEY })).toThrow(
      /envelope/i,
    );
  });
});
