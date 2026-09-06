/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/** `unique_violation` do Postgres — o SQLSTATE, que nenhum driver renomeia. */
const UNIQUE_VIOLATION_SQL_STATE = '23505';

const MAX_CAUSE_DEPTH = 8;

/**
 * O SQLSTATE atravessa DUAS embalagens antes de chegar aqui, e medi as duas em
 * 06/09/2026 contra o Postgres de verdade:
 *
 * 1. o Drizzle envolve tudo num `DrizzleQueryError`, que nao carrega `code`
 *    nenhum — o erro do driver fica em `.cause`;
 * 2. o driver do Bun poe `'ERR_POSTGRES_SERVER_ERROR'` em `code` e o SQLSTATE
 *    em **`errno`**.
 *
 * Ler `error.code === '23505'` na casca, que era o que estava escrito, nunca
 * casa: nao ha `code` ali, e o `code` que existe uma camada abaixo e o nome
 * generico do driver. O cadastro repetido virava `500 INTERNAL_ERROR` no ar.
 *
 * Por isso se percorre a corrente de `cause` e se aceita o SQLSTATE em
 * QUALQUER um dos dois campos: driver que volte a por o SQLSTATE em `code`
 * continua sendo entendido, e nao ha aqui um segundo lugar para desatualizar.
 */
export function isUniqueViolation(error: unknown): boolean {
  let current = error;
  // Teto, e nao `Set` de visitados: `cause` circular ja apareceu em driver, e
  // uma corrente real tem duas embalagens, nunca oito.
  for (let depth = 0; depth < MAX_CAUSE_DEPTH; depth += 1) {
    if (typeof current !== 'object' || current === null) return false;
    const fields = current as { readonly code?: unknown; readonly errno?: unknown; readonly cause?: unknown };
    if (fields.code === UNIQUE_VIOLATION_SQL_STATE || fields.errno === UNIQUE_VIOLATION_SQL_STATE) return true;
    current = fields.cause;
  }
  return false;
}
