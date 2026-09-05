/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { BACKUP_DESTINATIONS } from './backup.constant';
import { createBackupStorage } from './backup-storage.factory';
import { createFilesystemBackupStorage } from './filesystem-backup-storage';

const pastas: string[] = [];

async function pastaTemporaria(): Promise<string> {
  const pasta = await mkdtemp(join(tmpdir(), 'pp-backup-'));
  pastas.push(pasta);

  return pasta;
}

afterEach(async () => {
  await Promise.all(pastas.splice(0).map((pasta) => rm(pasta, { recursive: true, force: true })));
});

describe('o destino em disco guarda e devolve o mesmo objeto', () => {
  const CHAVE = 'pai-presente/dev/2026-09-05/2026-09-05T03-14-15-000Z.sql.enc';

  test('a pasta do dia nasce sozinha', async () => {
    const pasta = await pastaTemporaria();
    const storage = createFilesystemBackupStorage(pasta);

    await storage.put({ objectKey: CHAVE, bytes: new Uint8Array([1, 2, 3]) });

    expect(Buffer.from(await storage.get(CHAVE))).toEqual(Buffer.from([1, 2, 3]));
  });

  /**
   * O envelope e' cifrado, mas o arquivo ainda e' o banco inteiro: quem tiver
   * conta na maquina nao precisa nem tentar quebrar a cifra se puder copia-lo.
   */
  test('o arquivo nasce legivel so para o dono', async () => {
    const pasta = await pastaTemporaria();
    const storage = createFilesystemBackupStorage(pasta);

    await storage.put({ objectKey: CHAVE, bytes: new Uint8Array([1]) });

    expect((await stat(join(pasta, CHAVE))).mode & 0o077).toBe(0);
  });

  test('a listagem devolve a chave inteira, com as pastas', async () => {
    const pasta = await pastaTemporaria();
    const storage = createFilesystemBackupStorage(pasta);

    await storage.put({ objectKey: CHAVE, bytes: new Uint8Array([1]) });

    expect(await storage.list()).toEqual([CHAVE]);
  });
});

describe('destino sem para onde escrever falha no comeco, nao no dia do incidente', () => {
  /**
   * O silencio aqui seria o pior modo de falhar: o job rodaria toda noite,
   * gravaria num disco de contêiner efemero, e o backup so faltaria no unico dia
   * em que alguem for procurar.
   */
  test('s3 sem balde recusa dizendo a variavel', () => {
    expect(() =>
      createBackupStorage({
        destination: BACKUP_DESTINATIONS.S3,
        directory: '',
        bucket: '',
        endpoint: '',
      }),
    ).toThrow(/BACKUP_S3_BUCKET/);
  });

  test('disco sem pasta recusa dizendo a variavel', () => {
    expect(() =>
      createBackupStorage({
        destination: BACKUP_DESTINATIONS.FILESYSTEM,
        directory: '',
        bucket: '',
        endpoint: '',
      }),
    ).toThrow(/BACKUP_DIRECTORY/);
  });
});
