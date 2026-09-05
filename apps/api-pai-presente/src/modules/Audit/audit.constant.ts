/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/** Acoes sensiveis que deixam trilha (`security.md` §10). */
export const AUDIT_ACTIONS = {
  ACCOUNT_DELETED: 'account_deleted',
  ACCOUNT_EXPORTED: 'account_exported',
} as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const AUDIT_TARGET_TYPES = {
  ACCOUNT: 'account',
} as const;
export type AuditTargetType = (typeof AUDIT_TARGET_TYPES)[keyof typeof AUDIT_TARGET_TYPES];
