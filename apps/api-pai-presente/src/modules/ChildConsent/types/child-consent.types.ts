/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { AuditEntry } from '../../Audit/types/audit.types';
import type { ChildOwnershipPort } from '../../shared/child-ownership.interface';
import type { ChildConsentRow } from '../child-consent.table';

export type ChildConsentView = {
  readonly childId: string;
  readonly purpose: string;
  readonly grantedAt: Date;
};

export type FindChildConsentParams = {
  readonly childId: string;
  readonly userId: string;
  readonly purpose: string;
};

export type ListChildConsentsParams = {
  readonly childId: string;
  readonly userId: string;
};

export type ChildConsentRepository = {
  /**
   * Conceder duas vezes nao e' erro nem linha nova: e' a mesma resposta, e a
   * segunda so' atualiza a data. O `unique(child_id, purpose)` e a clausula de
   * conflito juntos tornam o `POST` idempotente (`apis.md` § Idempotencia) sem
   * o cliente precisar mandar chave nenhuma.
   */
  grant(params: FindChildConsentParams): Promise<ChildConsentRow>;
  findOne(params: FindChildConsentParams): Promise<ChildConsentRow | undefined>;
  listByChild(params: ListChildConsentsParams): Promise<ChildConsentRow[]>;
  revoke(params: FindChildConsentParams): Promise<ChildConsentRow | undefined>;
};

export type ChildConsentAuditPort = {
  record(entry: AuditEntry): Promise<void>;
};

export type ChildConsentUseCasesParams = {
  readonly repository: ChildConsentRepository;
  readonly childOwnership: ChildOwnershipPort;
  readonly audit: ChildConsentAuditPort;
};

export type GrantChildConsentParams = {
  readonly childId: string;
  readonly userId: string;
  readonly purpose: string;
  readonly clientIp: string;
};

export type RevokeChildConsentParams = GrantChildConsentParams;
