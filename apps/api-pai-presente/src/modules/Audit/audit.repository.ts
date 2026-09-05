/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { auditLogTable } from './audit.table';
import type { RecordAuditEntryParams } from './types/audit.types';

export async function recordAuditEntry({
  executor,
  entry,
}: RecordAuditEntryParams): Promise<void> {
  await executor.insert(auditLogTable).values({
    actorId: entry.actorId,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    clientIp: entry.clientIp,
  });
}
