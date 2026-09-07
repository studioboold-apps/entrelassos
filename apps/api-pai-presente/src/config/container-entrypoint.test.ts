/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { chmod, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, test } from 'bun:test';

/**
 * Medido em producao em 07/09/2026, com o volume ja montado: a subida da foto
 * respondeu `503 MEDIA_DIRECTORY_NOT_WRITABLE` apontando `/data/media`. Dentro
 * do container:
 *
 *     drwxr-xr-x  root root  /data        <- volume do Railway
 *     uid=1000(bun)                       <- quem roda a API
 *
 * O volume nasce de root, e a imagem declara `USER bun`. Nenhuma configuracao
 * de variavel conserta isso: quem tem de mudar e' o DONO da pasta, e so root
 * muda dono. Por isso o container passa a subir como root, ajustar a pasta e
 * ENTAO cair para `bun` — a API nunca atende requisicao como root.
 *
 * O teste roda o proprio script com `chown` e `su-exec` falsos no PATH, porque
 * o que precisa ser afirmado e' a SEQUENCIA (criar, dar o dono, largar o
 * privilegio), e ela nao aparece lendo o texto do arquivo.
 */
const ENTRYPOINT = join(import.meta.dir, '../../docker-entrypoint.sh');

const directories: string[] = [];

async function fakeBin(logPath: string): Promise<string> {
  const bin = await mkdtemp(join(tmpdir(), 'pp-bin-'));
  directories.push(bin);

  for (const command of ['chown', 'su-exec']) {
    const script = join(bin, command);
    await writeFile(script, `#!/bin/sh\necho "${command} $*" >> "${logPath}"\n`);
    await chmod(script, 0o755);
  }

  return bin;
}

type RunResult = {
  readonly exitCode: number;
  readonly log: string;
};

async function runEntrypoint(mediaDirectory: string | undefined): Promise<RunResult> {
  const workspace = await mkdtemp(join(tmpdir(), 'pp-entry-'));
  directories.push(workspace);
  const logPath = join(workspace, 'chamadas.txt');
  await writeFile(logPath, '');

  const bin = await fakeBin(logPath);
  const environment: Record<string, string> = {
    PATH: `${bin}:/usr/bin:/bin:/usr/sbin:/sbin`,
  };
  if (mediaDirectory !== undefined) environment.MEDIA_DIRECTORY = mediaDirectory;

  const child = Bun.spawn(['sh', ENTRYPOINT, 'bun', 'dist/main.js'], {
    env: environment,
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const exitCode = await child.exited;

  return { exitCode, log: await readFile(logPath, 'utf8') };
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe('o container ajusta a pasta de midia e ENTAO larga o privilegio', () => {
  test('a pasta apontada pela variavel passa a existir', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'pp-vol-'));
    directories.push(workspace);
    const media = join(workspace, 'media');

    await runEntrypoint(media);

    expect((await stat(media)).isDirectory()).toBe(true);
  });

  test('o dono da pasta passa a ser quem roda a API', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'pp-vol-'));
    directories.push(workspace);
    const media = join(workspace, 'media');

    const { log } = await runEntrypoint(media);

    expect(log).toContain('chown');
    expect(log).toContain('bun');
    expect(log).toContain(media);
  });

  /**
   * A metade que importa para seguranca: atender HTTP como root trocaria um
   * defeito de escrita por um defeito muito pior, e silencioso.
   */
  test('o processo que atende cai para bun, com o comando intacto', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'pp-vol-'));
    directories.push(workspace);

    const { log, exitCode } = await runEntrypoint(join(workspace, 'media'));

    expect(exitCode).toBe(0);
    expect(log).toContain('su-exec bun bun dist/main.js');
  });

  /**
   * O pre-deploy roda o migrador pelo mesmo entrypoint e nao tem nada a ver com
   * midia. Sem a variavel o script nao pode morrer, senao a migration para de
   * entrar.
   */
  test('sem a variavel, ainda larga o privilegio e nao morre', async () => {
    const { log, exitCode } = await runEntrypoint(undefined);

    expect(exitCode).toBe(0);
    expect(log).toContain('su-exec bun bun dist/main.js');
    expect(log).not.toContain('chown');
  });
});
