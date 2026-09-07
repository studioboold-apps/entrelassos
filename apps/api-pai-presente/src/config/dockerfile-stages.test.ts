/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'bun:test';

/**
 * `docker build` sem `--target` constroi o ULTIMO estagio do arquivo, e e assim
 * que o Railway constroi. Isso torna a ORDEM dos estagios uma decisao de
 * producao, escrita num lugar onde ela nao parece decisao nenhuma.
 *
 * Medido em 05/09/2026, primeiro deploy: o `backup` era o ultimo estagio, entao
 * a imagem publicada foi a do backup. Ela nao copia `drizzle`, e o pre-deploy
 * morreu com `Can't find meta/_journal.json file` — mensagem que fala de
 * migration e nao diz uma palavra sobre estagio errado.
 */
const REPOSITORY_ROOT = join(import.meta.dir, '../../../..');

const DOCKERFILES = {
  api: {
    path: join(REPOSITORY_ROOT, 'apps/api-pai-presente/Dockerfile'),
    servingCommand: 'CMD ["bun", "dist/main.js"]',
  },
  web: {
    path: join(REPOSITORY_ROOT, 'apps/frontend-pai-presente/Dockerfile'),
    servingCommand: 'CMD ["bun", "server/main.js"]',
  },
} as const;

type DockerfileStage = {
  readonly name: string;
  readonly body: string;
};

function readStages(path: string): readonly DockerfileStage[] {
  const lines = readFileSync(path, 'utf8').split('\n');
  const stages: DockerfileStage[] = [];

  for (const line of lines) {
    const declaration = /^FROM\s+\S+\s+AS\s+(\S+)/i.exec(line.trim());
    if (declaration?.[1] !== undefined) {
      stages.push({ name: declaration[1], body: '' });
      continue;
    }
    const current = stages.at(-1);
    if (current !== undefined) {
      stages[stages.length - 1] = { name: current.name, body: `${current.body}${line}\n` };
    }
  }

  return stages;
}

describe('o estagio padrao da imagem e o que ATENDE', () => {
  for (const [application, dockerfile] of Object.entries(DOCKERFILES)) {
    test(`${application}: o ultimo estagio e o que sobe`, () => {
      const stages = readStages(dockerfile.path);
      const last = stages.at(-1);

      expect(last?.body).toContain(dockerfile.servingCommand);
    });
  }

  /**
   * O migrador le `./drizzle` a partir do diretorio de trabalho. Sem a pasta na
   * imagem, o pre-deploy do Railway falha ANTES de o servidor existir.
   */
  test('api: o estagio padrao carrega as migrations', () => {
    const last = readStages(DOCKERFILES.api.path).at(-1);

    expect(last?.body).toContain('./drizzle');
  });

  /**
   * O backup continua existindo, so nao pode ser o padrao: `pg_dump` na imagem
   * que atende HTTP engorda a superficie de toda requisicao.
   */
  test('api: o backup continua sendo um alvo, nao o padrao', () => {
    const stages = readStages(DOCKERFILES.api.path);

    expect(stages.map((stage) => stage.name)).toContain('backup');
    expect(stages.at(-1)?.name).not.toBe('backup');
  });

  /**
   * `USER bun` no estagio que atende parece endurecimento e derruba a midia: o
   * volume do Railway nasce de root, e quem entra como bun nao muda o dono dele.
   * Quem larga o privilegio e' o entrypoint, DEPOIS de ajustar a pasta — e a
   * sequencia esta afirmada em `container-entrypoint.test.ts`.
   */
  test('api: o estagio que atende sobe pelo entrypoint, sem USER fixo', () => {
    const last = readStages(DOCKERFILES.api.path).at(-1);

    const directives = (last?.body ?? '').split('\n').map((line) => line.trim());

    expect(last?.body).toContain('docker-entrypoint.sh');
    expect(directives.filter((line) => line.startsWith('USER '))).toHaveLength(0);
  });
});
