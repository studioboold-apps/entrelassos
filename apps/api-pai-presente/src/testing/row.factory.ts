/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

export type IdentityColumns = {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

const FIXED_INSTANT = new Date('2026-01-01T12:00:00.000Z');

/** Data fixa: linha de teste nao pode mudar de valor a cada rodada. */
export function buildIdentity(id: string): IdentityColumns {
  return { id, createdAt: FIXED_INSTANT, updatedAt: FIXED_INSTANT };
}

/**
 * `exactOptionalPropertyTypes` distingue chave ausente de chave com `undefined`:
 * espalhar um corpo parcial sobre a linha injetaria `undefined` numa coluna que e
 * `string | null`. O fake aplica so o que veio de fato.
 */
export type RowOverrides<TRow> = { readonly [Key in keyof TRow]?: TRow[Key] | undefined };

export function applyOverrides<TRow extends object>(
  row: TRow,
  overrides: RowOverrides<TRow> | object,
): TRow {
  const defined = Object.entries(overrides).filter(([, value]) => value !== undefined);
  return { ...row, ...Object.fromEntries(defined) } as TRow;
}
