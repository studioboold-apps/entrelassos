/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { drizzle } from 'drizzle-orm/bun-sql';

import * as schema from './schema';

/**
 * Fabrica, nao singleton de modulo: importar o cliente nao pode exigir
 * DATABASE_URL, senao todo teste de contrato passa a precisar de banco.
 */
export function createDatabaseClient(databaseUrl: string) {
  return drizzle(databaseUrl, { schema, casing: 'snake_case' });
}

export type Database = ReturnType<typeof createDatabaseClient>;
