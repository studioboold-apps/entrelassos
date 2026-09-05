/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { BACKUP_OBJECT_EXTENSION, BACKUP_OBJECT_ROOT } from './backup.constant';

export type BuildBackupObjectKeyParams = {
  readonly environmentName: string;
  readonly now: Date;
};

/**
 * Ambiente e relogio, e mais nada: `security.md` §7 proibe dado pessoal no NOME
 * da chave, que e' justamente a parte do balde que aparece em listagem e em log.
 * A pasta por dia e' o que torna a politica de retencao um `DELETE` de prefixo.
 */
export function buildBackupObjectKey({ environmentName, now }: BuildBackupObjectKeyParams): string {
  const timestamp = now.toISOString();
  const day = timestamp.slice(0, 'AAAA-MM-DD'.length);
  const instant = timestamp.replaceAll(':', '-').replaceAll('.', '-');

  return `${BACKUP_OBJECT_ROOT}/${environmentName}/${day}/${instant}${BACKUP_OBJECT_EXTENSION}`;
}
