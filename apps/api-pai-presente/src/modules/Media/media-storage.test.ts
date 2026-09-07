/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createFilesystemMediaStorage } from './filesystem-media-storage';
import { createMediaStorage } from './media-storage.factory';
import { MEDIA_DESTINATIONS } from './media.constant';

const CHAVE = 'children/8f1c9d02-0000-4000-8000-000000000001/2b7a0004-0000-4000-8000-000000000002';
const FOTO = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

const pastas: string[] = [];

async function pastaTemporaria(): Promise<string> {
  const pasta = await mkdtemp(join(tmpdir(), 'pp-media-'));
  pastas.push(pasta);

  return pasta;
}

afterEach(async () => {
  await Promise.all(pastas.splice(0).map((pasta) => rm(pasta, { recursive: true, force: true })));
});

describe('o destino em disco guarda, devolve e apaga', () => {
  test('a pasta do filho nasce sozinha', async () => {
    const storage = createFilesystemMediaStorage(await pastaTemporaria());

    await storage.put({ objectKey: CHAVE, bytes: FOTO, contentType: 'image/jpeg' });

    expect(Buffer.from(await storage.get(CHAVE))).toEqual(Buffer.from(FOTO));
  });

  /** Foto de crianca em maquina compartilhada: quem tem conta nao precisa da API. */
  test('o arquivo nasce legivel so para o dono', async () => {
    const pasta = await pastaTemporaria();
    const storage = createFilesystemMediaStorage(pasta);

    await storage.put({ objectKey: CHAVE, bytes: FOTO, contentType: 'image/jpeg' });

    expect((await stat(join(pasta, CHAVE))).mode & 0o077).toBe(0);
  });

  /**
   * `D5` do GOAL: apagar a linha do Postgres nao apaga byte nenhum. Este e' o
   * lado do apagar que de fato remove o arquivo.
   */
  test('apagar remove os bytes', async () => {
    const storage = createFilesystemMediaStorage(await pastaTemporaria());

    await storage.put({ objectKey: CHAVE, bytes: FOTO, contentType: 'image/jpeg' });
    await storage.delete(CHAVE);

    expect(storage.get(CHAVE)).rejects.toThrow();
  });

  /**
   * O pai clica em apagar duas vezes, ou a remocao em cascata passa por um
   * arquivo que uma tentativa anterior ja tirou. Nos dois casos o pedido dele e'
   * "que isto nao exista", e isso ja aconteceu.
   */
  test('apagar o que nao existe nao e falha', async () => {
    const storage = createFilesystemMediaStorage(await pastaTemporaria());

    expect(storage.delete(CHAVE)).resolves.toBeUndefined();
  });

  test('chave que sai da pasta e recusada', async () => {
    const storage = createFilesystemMediaStorage(await pastaTemporaria());

    expect(
      storage.put({ objectKey: '../fora.jpg', bytes: FOTO, contentType: 'image/jpeg' }),
    ).rejects.toThrow(/sai da pasta/);
  });
});

describe('o destino em disco nao finge assinar link', () => {
  /**
   * A capacidade e' opcional POR AUSENCIA. Se o disco devolvesse um caminho
   * qualquer, a foto sairia num `src` de imagem que o navegador nao abre — e o
   * defeito apareceria so em desenvolvimento, que e' onde ninguem procura.
   */
  test('presignRead nao existe em disco', async () => {
    const storage = createFilesystemMediaStorage(await pastaTemporaria());

    expect(storage.presignRead).toBeUndefined();
  });
});

describe('a fabrica recusa destino sem para onde escrever', () => {
  /**
   * O silencio aqui seria o pior modo de falhar: o pai subiria o album inteiro
   * para o disco efemero do conteiner e ele desapareceria no proximo deploy,
   * sem uma linha de erro.
   */
  test('balde vazio com destino s3 morre no boot', () => {
    expect(() =>
      createMediaStorage({
        destination: MEDIA_DESTINATIONS.S3,
        directory: '.media',
        bucket: '',
        endpoint: '',
      }),
    ).toThrow(/MEDIA_S3_BUCKET/);
  });

  test('pasta vazia com destino em disco morre no boot', () => {
    expect(() =>
      createMediaStorage({
        destination: MEDIA_DESTINATIONS.FILESYSTEM,
        directory: '',
        bucket: '',
        endpoint: '',
      }),
    ).toThrow(/MEDIA_DIRECTORY/);
  });

  test('destino em disco com pasta devolve o destino em disco', async () => {
    const storage = createMediaStorage({
      destination: MEDIA_DESTINATIONS.FILESYSTEM,
      directory: await pastaTemporaria(),
      bucket: '',
      endpoint: '',
    });

    await storage.put({ objectKey: CHAVE, bytes: FOTO, contentType: 'image/jpeg' });

    expect(Buffer.from(await storage.get(CHAVE))).toEqual(Buffer.from(FOTO));
  });
});
