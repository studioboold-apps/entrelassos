/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { BACKUP_KEY_BYTES } from './backup.constant';
import { decryptBackup } from './backup-cipher.util';
import { createBackup } from './create-backup.use-case';
import { restoreBackup } from './restore-backup.use-case';
import type { BackupStorage } from './backup-storage.interface';

const KEY = Buffer.alloc(BACKUP_KEY_BYTES, 3);
const MARCA = 'Joaquim Girassol';
const DUMP = Buffer.from(`COPY children FROM stdin;\nc-1\t${MARCA}\n\\.\n`, 'utf8');
const QUANDO = new Date('2026-09-05T03:14:15.000Z');

/**
 * O balde que RECUSA texto claro. A regra do `security.md` §5 e' de ORDEM
 * ("criptografado antes do upload"), e ordem nao se prova lendo o codigo: um
 * refator que trocasse as duas linhas passaria em qualquer teste que so
 * conferisse o arquivo final. Aqui quem reprova e' o proprio destino.
 */
function criarBaldeVigilante(): BackupStorage & { readonly objetos: Map<string, Uint8Array> } {
  const objetos = new Map<string, Uint8Array>();

  return {
    objetos,
    async put({ objectKey, bytes }) {
      if (Buffer.from(bytes).includes(MARCA)) {
        throw new Error(`texto claro chegou ao balde em ${objectKey}`);
      }
      objetos.set(objectKey, bytes);
    },
    async get(objectKey) {
      const bytes = objetos.get(objectKey);
      if (bytes === undefined) throw new Error(`objeto ausente: ${objectKey}`);
      return bytes;
    },
    async list() {
      return [...objetos.keys()];
    },
  };
}

const despejador = { dump: async () => DUMP };

describe('o backup sobe cifrado, e a chave nao vai junto', () => {
  test('o que chega ao balde nao tem o dump legivel', async () => {
    const storage = criarBaldeVigilante();

    const { objectKey } = await createBackup({ dumper: despejador, storage, key: KEY, now: QUANDO });

    expect(Buffer.from(storage.objetos.get(objectKey) ?? new Uint8Array()).includes(MARCA)).toBe(
      false,
    );
  });

  test('e o que esta la decifra de volta no dump exato', async () => {
    const storage = criarBaldeVigilante();

    const { objectKey } = await createBackup({ dumper: despejador, storage, key: KEY, now: QUANDO });
    const envelope = await storage.get(objectKey);

    expect(Buffer.from(decryptBackup({ envelope, key: KEY }))).toEqual(DUMP);
  });

  /**
   * `security.md` §7: nada de dado pessoal no NOME da chave do objeto — e o nome
   * e' a parte do balde que costuma ficar visivel em listagem e em log.
   */
  test('o nome do objeto e so ambiente e relogio', async () => {
    const storage = criarBaldeVigilante();

    const { objectKey } = await createBackup({
      dumper: despejador,
      storage,
      key: KEY,
      now: QUANDO,
      environmentName: 'dev',
    });

    expect(objectKey).toBe('pai-presente/dev/2026-09-05/2026-09-05T03-14-15-000Z.sql.enc');
  });

  test('dois backups do mesmo dia nao se sobrescrevem', async () => {
    const storage = criarBaldeVigilante();

    await createBackup({ dumper: despejador, storage, key: KEY, now: QUANDO });
    await createBackup({
      dumper: despejador,
      storage,
      key: KEY,
      now: new Date('2026-09-05T09:00:00.000Z'),
    });

    expect(await storage.list()).toHaveLength(2);
  });
});

describe('o restore fecha o ciclo', () => {
  test('o que voltou do balde e o que o banco recebe', async () => {
    const storage = criarBaldeVigilante();
    const recebido: Uint8Array[] = [];
    const restaurador = {
      restore: async (bytes: Uint8Array) => {
        recebido.push(bytes);
      },
    };

    const { objectKey } = await createBackup({ dumper: despejador, storage, key: KEY, now: QUANDO });
    await restoreBackup({ objectKey, storage, key: KEY, restorer: restaurador });

    expect(recebido).toHaveLength(1);
    expect(Buffer.from(recebido[0] ?? new Uint8Array())).toEqual(DUMP);
  });

  /**
   * Restore que aceita lixo e' pior que restore que falha: ele apaga o banco bom
   * e poe no lugar um dump truncado, e ninguem descobre no mesmo dia.
   */
  test('envelope adulterado nao chega ao banco', async () => {
    const storage = criarBaldeVigilante();
    let tocouNoBanco = false;
    const restaurador = {
      restore: async () => {
        tocouNoBanco = true;
      },
    };

    const { objectKey } = await createBackup({ dumper: despejador, storage, key: KEY, now: QUANDO });
    const envelope = Buffer.from(await storage.get(objectKey));
    envelope[envelope.byteLength - 1] = (envelope[envelope.byteLength - 1] ?? 0) ^ 0xff;
    storage.objetos.set(objectKey, envelope);

    await expect(
      restoreBackup({ objectKey, storage, key: KEY, restorer: restaurador }),
    ).rejects.toThrow();
    expect(tocouNoBanco).toBe(false);
  });
});
