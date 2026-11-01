/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { AuditEntry } from '../../Audit/types/audit.types';
import type { FamilyValueKind } from '../family-values.constant';

/** O que o pai escolheu, por rotulo. `null` e' "prefiro nao dizer". */
export type FamilyValuesView = {
  readonly religion: string | null;
  readonly politics: string | null;
  readonly orientation: string | null;
  /** Quando o pai aceitou; `null` quando nao ha nada guardado. */
  readonly consentGrantedAt: Date | null;
};

export type FamilyValueChoice = {
  readonly kind: FamilyValueKind;
  readonly label: string;
};

export type FamilyValuesRepository = {
  findByUser(userId: string): Promise<readonly (FamilyValueChoice & { readonly grantedAt: Date })[]>;
  /** Troca as escolhas do pai pelas dadas, na mesma transacao; tipo ausente e' apagado. */
  replace(params: { readonly userId: string; readonly choices: readonly FamilyValueChoice[] }): Promise<void>;
  removeAll(userId: string): Promise<number>;
  listOptions(kind: FamilyValueKind): Promise<readonly string[]>;
};

export type FamilyValuesAuditPort = {
  record(entry: AuditEntry): Promise<void>;
};
