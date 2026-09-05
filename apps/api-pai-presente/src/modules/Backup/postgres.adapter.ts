/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { DatabaseDumper, DatabaseRestorer } from './backup-storage.interface';

/**
 * `--no-owner` e `--no-privileges` porque o dono do banco de producao nao existe
 * no banco em que se prova a restauracao, e um dump que exige o papel certo nao
 * restaura em lugar nenhum — descoberta que so aparece no dia do incidente.
 */
const PG_DUMP_FLAGS = ['--format=plain', '--no-owner', '--no-privileges'] as const;
/** Sem isto o `psql` engole o erro da linha 3 e sai com 0, "restaurado". */
const PSQL_FLAGS = ['--quiet', '--no-psqlrc', '-v', 'ON_ERROR_STOP=1'] as const;

export type PostgresProcessEnvironment = Readonly<Record<string, string>>;

/**
 * A senha vai por AMBIENTE, nunca em `argv`: argumento de processo aparece em
 * `ps` para qualquer usuario da maquina, e segredo que apareceu em terminal e'
 * segredo queimado (`security.md` §4).
 */
export function buildPostgresEnvironment(databaseUrl: string): PostgresProcessEnvironment {
  const url = new URL(databaseUrl);

  return {
    PGHOST: url.hostname,
    PGPORT: url.port.length === 0 ? '5432' : url.port,
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGDATABASE: url.pathname.replace(/^\//, ''),
  };
}

async function runPostgresTool(
  command: readonly string[],
  databaseUrl: string,
  stdin?: Uint8Array,
): Promise<Uint8Array> {
  const child = Bun.spawn([...command], {
    env: { ...process.env, ...buildPostgresEnvironment(databaseUrl) },
    stdin: stdin ?? 'ignore',
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).arrayBuffer(),
    new Response(child.stderr).text(),
    child.exited,
  ]);

  if (exitCode !== 0) throw new Error(`${command[0]} saiu com ${exitCode}: ${stderr.trim()}`);

  return new Uint8Array(stdout);
}

export function createPostgresDumper(databaseUrl: string): DatabaseDumper {
  return {
    dump: () => runPostgresTool(['pg_dump', ...PG_DUMP_FLAGS], databaseUrl),
  };
}

export function createPostgresRestorer(databaseUrl: string): DatabaseRestorer {
  return {
    restore: async (dump) => {
      await runPostgresTool(['psql', ...PSQL_FLAGS], databaseUrl, dump);
    },
  };
}
