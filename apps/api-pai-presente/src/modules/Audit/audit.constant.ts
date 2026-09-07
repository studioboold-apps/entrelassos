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
  /**
   * LEITURA de exame deixa trilha; leitura de foto NAO. A trilha do art. 46 da
   * LGPD existe para poder responder "quem viu o dado de saude desta crianca, e
   * quando" — e carimbar cada foto que o album pinta na tela encheria a mesma
   * tabela de milhares de linhas por sessao, afogando exatamente a linha que a
   * pergunta procura.
   */
  CHILD_EXAM_READ: 'child_exam_read',
  /**
   * Apagar deixa trilha, e as duas metades do art. 18 explicam por que: o pai
   * tem direito a eliminacao E direito a saber o que foi feito com o dado. A
   * linha da tabela desaparece; sem esta, nada no sistema sabe que ela existiu.
   */
  CHILD_PHOTO_DELETED: 'child_photo_deleted',
  CHILD_EXAM_DELETED: 'child_exam_deleted',
} as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const AUDIT_TARGET_TYPES = {
  ACCOUNT: 'account',
  CHILD_FILE: 'child_file',
} as const;
export type AuditTargetType = (typeof AUDIT_TARGET_TYPES)[keyof typeof AUDIT_TARGET_TYPES];
