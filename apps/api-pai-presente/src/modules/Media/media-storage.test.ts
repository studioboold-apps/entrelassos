/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { afterEach, describe, expect, test } from 'bun:test';
import { chmod, mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createFilesystemMediaStorage } from './filesystem-media-storage';
import { createMediaStorage } from './media-storage.factory';
import { MEDIA_DESTINATIONS, MEDIA_DIRECTORY_VARIABLE } from './media.constant';
import { MediaDirectoryNotWritableError } from './media.error';

const CHAVE = 'children/8f1c9d02-0000-4000-8000-000000000001/2b7a0004-0000-4000-8000-000000000002';
const FOTO = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

const pastas: string[] = [];

async function pastaTemporaria(): Promise<string> {
  const pasta = await mkdtemp(join(tmpdir(), 'pp-media-'));
  pastas.push(pasta);

  return pasta;
}

afterEach(async () => {
  /** Pasta sem escrita nao se apaga: devolver o modo antes de remover. */
  await Promise.all(
    pastas.splice(0).map(async (pasta) => {
      await chmod(pasta, 0o700).catch(() => undefined);
      await rm(pasta, { recursive: true, force: true });
    }),
  );
});

/**
 * Medido em producao em 07/09/2026: a imagem da API roda com `WORKDIR /app` e
 * usuario sem escrita ali, e `MEDIA_DIRECTORY` valia `.media` — relativo. A
 * primeira foto respondeu `500 INTERNAL_ERROR`, e a unica pista era
 * `EACCES: permission denied, mkdir '/app/.media'` no log do servidor.
 *
 * O codigo estava certo e a configuracao errada; o defeito e' a API ter dito
 * "erro interno" para configuracao de servidor. Chave de midia ausente ja
 * responde 503 nomeando a variavel (`MediaKeyInvalidError`), e pasta sem
 * escrita e' o mesmo tipo de falha: quem opera precisa do NOME da variavel na
 * resposta, nao de um rastro de pilha que so aparece para quem tem o log.
 */
describe('pasta de midia sem escrita recusa em voz alta', () => {
  test('a falha nomeia a variavel, e nao vira erro interno', async () => {
    const pasta = await pastaTemporaria();
    await chmod(pasta, 0o500);
    const storage = createFilesystemMediaStorage(pasta);

    const guardar = storage.put({ objectKey: CHAVE, bytes: FOTO, contentType: 'image/jpeg' });

    await expect(guardar).rejects.toBeInstanceOf(MediaDirectoryNotWritableError);
  });

  test('a mensagem diz qual variavel mudar e qual pasta falhou', async () => {
    const pasta = await pastaTemporaria();
    await chmod(pasta, 0o500);
    const storage = createFilesystemMediaStorage(pasta);

    const falha = await storage
      .put({ objectKey: CHAVE, bytes: FOTO, contentType: 'image/jpeg' })
      .then(() => undefined)
      .catch((erro: unknown) => erro as MediaDirectoryNotWritableError);

    expect(falha?.message).toContain(MEDIA_DIRECTORY_VARIABLE);
    expect(falha?.message).toContain(pasta);
  });

  /**
   * 503, como a chave: 500 diria ao pai "tente de novo", e tentar de novo na
   * mesma pasta falha para sempre.
   */
  test('e 503, porque e configuracao do servidor', async () => {
    const pasta = await pastaTemporaria();
    await chmod(pasta, 0o500);
    const storage = createFilesystemMediaStorage(pasta);

    const falha = await storage
      .put({ objectKey: CHAVE, bytes: FOTO, contentType: 'image/jpeg' })
      .then(() => undefined)
      .catch((erro: unknown) => erro as MediaDirectoryNotWritableError);

    expect(falha?.statusCode).toBe(503);
  });
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
