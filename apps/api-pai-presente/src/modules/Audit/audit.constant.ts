/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/** Acoes sensiveis que deixam trilha (`security.md` §10). */
export const AUDIT_ACTIONS = {
  ACCOUNT_DELETED: 'account_deleted',
  ACCOUNT_EXPORTED: 'account_exported',
  /**
   * Foto e exame deixam trilha SEPARADA, e nao um `child_file_written` unico:
   * exame e' dado de saude sensivel (LGPD art. 11), e o relatorio que a
   * autoridade pede e' "quem mexeu em exame", nao "quem mexeu em arquivo".
   */
  CHILD_PHOTO_UPLOADED: 'child_photo_uploaded',
  CHILD_EXAM_UPLOADED: 'child_exam_uploaded',
} as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const AUDIT_TARGET_TYPES = {
  ACCOUNT: 'account',
  CHILD_FILE: 'child_file',
} as const;
export type AuditTargetType = (typeof AUDIT_TARGET_TYPES)[keyof typeof AUDIT_TARGET_TYPES];
