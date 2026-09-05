/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';
import { getTableConfig } from 'drizzle-orm/pg-core';

import { auditLogTable } from './audit.table';

/**
 * Toda outra tabela do esquema aponta para `users` com `onDelete: cascade`, e e'
 * isso que faz `DELETE /v1/me` limpar as dez de uma vez. A trilha e' a UNICA que
 * nao pode fazer o mesmo: com a chave estrangeira, apagar a conta apagaria junto
 * a prova de que ela foi apagada — que e' exatamente o registro que o §10 da
 * `security.md` manda guardar.
 *
 * O ator entra como uuid solto, de proposito. Este teste existe porque a
 * referencia e' o reflexo de quem escreve tabela nova neste esquema.
 */
describe('a trilha de auditoria sobrevive a quem ela audita', () => {
  test('a tabela nao referencia usuario nenhum', () => {
    expect(getTableConfig(auditLogTable).foreignKeys).toHaveLength(0);
  });

  test('mas guarda quem foi o ator', () => {
    const columns = getTableConfig(auditLogTable).columns.map((column) => column.name);

    expect(columns).toContain('actor_id');
    expect(columns).toContain('action');
    expect(columns).toContain('target_id');
    expect(columns).toContain('client_ip');
  });
});
