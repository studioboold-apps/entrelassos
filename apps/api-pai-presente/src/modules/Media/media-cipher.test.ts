/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { encryptBackup } from '../Backup/backup-cipher.util';
import { ENVELOPE_KEY_BYTES } from '../shared/crypto/envelope-cipher.constant';

import { decryptMedia, encryptMedia, readMediaKey } from './media-cipher';
import { MEDIA_ENVELOPE_MAGIC } from './media.constant';
import { MediaEnvelopeInvalidError, MediaKeyInvalidError } from './media.error';

const KEY = Buffer.alloc(ENVELOPE_KEY_BYTES, 11);
const OUTRA_KEY = Buffer.alloc(ENVELOPE_KEY_BYTES, 13);

/**
 * Um laudo de verdade tem o nome da crianca no cabecalho e o achado no corpo.
 * Sao esses dois trechos que os testes procuram no que vai para o balde.
 */
const EXAME = Buffer.from(
  '%PDF-1.4\nPaciente: Joaquim Girassol\nHemoglobina: 11,2 g/dL — abaixo do esperado\n',
  'utf8',
);

describe('a chave do exame e propria, e recusa antes de cifrar', () => {
  test('base64 de 32 bytes vira chave', () => {
    expect(readMediaKey(KEY.toString('base64')).byteLength).toBe(ENVELOPE_KEY_BYTES);
  });

  /**
   * Chave de 31 bytes e' o caso perigoso: ela PARECE configurada. Sem esta
   * recusa, o `createCipheriv` morreria com mensagem de biblioteca depois de o
   * arquivo do pai ja ter sido lido para a memoria.
   */
  test('chave de 31 bytes e recusada, e nao "quase funciona"', () => {
    expect(() => readMediaKey(Buffer.alloc(31, 1).toString('base64'))).toThrow(
      MediaKeyInvalidError,
    );
    expect(() => readMediaKey(Buffer.alloc(31, 1).toString('base64'))).toThrow(/32 bytes/);
  });

  /** A recusa diz o nome da variavel: quem le o 503 precisa saber o que configurar. */
  test('chave ausente diz MEDIA_ENCRYPTION_KEY', () => {
    expect(() => readMediaKey('')).toThrow(/MEDIA_ENCRYPTION_KEY/);
  });
});

describe('o que sobe para o balde nao e o arquivo do pai', () => {
  test('ida e volta devolve os mesmos bytes', () => {
    const envelope = encryptMedia({ plaintext: EXAME, key: KEY });

    expect(Buffer.from(decryptMedia({ envelope, key: KEY }))).toEqual(EXAME);
  });

  /**
   * A prova que sustenta o `security.md` §5 e o art. 46 da LGPD: quem tiver
   * acesso ao balde nao tem acesso ao laudo.
   */
  test('nem o nome da crianca nem o achado aparecem no envelope', () => {
    const envelope = Buffer.from(encryptMedia({ plaintext: EXAME, key: KEY }));

    expect(envelope.includes('Joaquim Girassol')).toBe(false);
    expect(envelope.includes('Hemoglobina')).toBe(false);
    expect(envelope.includes('%PDF')).toBe(false);
  });

  /** IV repetido em AES-GCM entrega o texto claro; dois exames iguais o expoem. */
  test('dois envelopes do MESMO exame nao sao iguais', () => {
    const primeiro = Buffer.from(encryptMedia({ plaintext: EXAME, key: KEY }));
    const segundo = Buffer.from(encryptMedia({ plaintext: EXAME, key: KEY }));

    expect(primeiro.equals(segundo)).toBe(false);
  });
});

describe('envelope adulterado recusa em voz alta', () => {
  /**
   * Sem a etiqueta do GCM, byte trocado volta como conteudo diferente e em
   * silencio — num laudo, um numero trocado.
   */
  test('etiqueta mexida faz o decifrar LANCAR, nao devolver lixo', () => {
    const envelope = Buffer.from(encryptMedia({ plaintext: EXAME, key: KEY }));
    const posicaoDaEtiqueta = MEDIA_ENVELOPE_MAGIC.length + 12;
    envelope[posicaoDaEtiqueta] = envelope[posicaoDaEtiqueta]! ^ 0xff;

    expect(() => decryptMedia({ envelope, key: KEY })).toThrow();
  });

  test('chave errada recusa', () => {
    const envelope = encryptMedia({ plaintext: EXAME, key: KEY });

    expect(() => decryptMedia({ envelope, key: OUTRA_KEY })).toThrow();
  });

  /**
   * A magica separada nao e detalhe: se as duas fossem `PPBK1`, um dump de banco
   * colocado no lugar de um exame passaria a etiqueta e seria SERVIDO ao pai
   * como se fosse o laudo do filho.
   */
  test('envelope de BACKUP nao abre como midia, mesmo com a chave certa', () => {
    const envelope = encryptBackup({ plaintext: EXAME, key: KEY });

    expect(() => decryptMedia({ envelope, key: KEY })).toThrow(MediaEnvelopeInvalidError);
  });
});
