/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { Database } from '../../../database/client';
import type { AuditAction, AuditTargetType } from '../audit.constant';

/**
 * So `insert` porque a trilha so escreve, e porque assim o mesmo escritor serve
 * ao banco e a TRANSACAO: a exclusao da conta e a linha que a registra tem de
 * cair ou passar juntas, senao a trilha mente numa das duas direcoes.
 */
export type AuditExecutor = Pick<Database, 'insert'>;

export type AuditEntry = {
  readonly actorId: string;
  readonly action: AuditAction;
  readonly targetType: AuditTargetType;
  readonly targetId: string;
  readonly clientIp: string;
};

export type RecordAuditEntryParams = {
  readonly executor: AuditExecutor;
  readonly entry: AuditEntry;
};
