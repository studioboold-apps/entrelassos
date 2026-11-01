/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '../Audit/audit.constant';
import { FAMILY_VALUE_KINDS, type FamilyValueKind } from './family-values.constant';
import type { SaveFamilyValuesBody } from './family-values.schema';
import type {
  FamilyValueChoice,
  FamilyValuesAuditPort,
  FamilyValuesRepository,
  FamilyValuesView,
} from './types/family-values.types';

/** Campo do corpo/da tela para o tipo guardado no banco. */
const FIELD_BY_KIND = {
  [FAMILY_VALUE_KINDS.RELIGION]: 'religion',
  [FAMILY_VALUE_KINDS.POLITICS]: 'politics',
  [FAMILY_VALUE_KINDS.ORIENTATION]: 'orientation',
} as const satisfies Record<FamilyValueKind, keyof FamilyValuesView>;

const EMPTY_VIEW: FamilyValuesView = { religion: null, politics: null, orientation: null, consentGrantedAt: null };

export type FamilyValuesUseCases = {
  findMine(userId: string): Promise<FamilyValuesView>;
  saveMine(params: {
    readonly userId: string;
    readonly values: SaveFamilyValuesBody;
    readonly clientIp: string;
  }): Promise<FamilyValuesView>;
  removeMine(params: { readonly userId: string; readonly clientIp: string }): Promise<void>;
  listOptions(kind: FamilyValueKind): Promise<readonly string[]>;
};

export function createFamilyValuesUseCases({
  repository,
  audit,
}: {
  readonly repository: FamilyValuesRepository;
  readonly audit: FamilyValuesAuditPort;
}): FamilyValuesUseCases {
  async function findMine(userId: string): Promise<FamilyValuesView> {
    const rows = await repository.findByUser(userId);
    if (rows.length === 0) return EMPTY_VIEW;
    const view: { -readonly [K in keyof FamilyValuesView]: FamilyValuesView[K] } = { ...EMPTY_VIEW };
    for (const row of rows) {
      view[FIELD_BY_KIND[row.kind]] = row.label;
      if (view.consentGrantedAt === null || row.grantedAt < view.consentGrantedAt) {
        view.consentGrantedAt = row.grantedAt;
      }
    }
    return view;
  }

  return {
    findMine,

    async saveMine({ userId, values, clientIp }) {
      const choices: FamilyValueChoice[] = [];
      for (const [kind, field] of Object.entries(FIELD_BY_KIND) as [FamilyValueKind, keyof SaveFamilyValuesBody][]) {
        const label = values[field];
        if (typeof label === 'string') choices.push({ kind, label });
      }
      await repository.replace({ userId, choices });
      await audit.record({
        actorId: userId,
        action: choices.length === 0 ? AUDIT_ACTIONS.FAMILY_VALUES_DELETED : AUDIT_ACTIONS.FAMILY_VALUES_SAVED,
        targetType: AUDIT_TARGET_TYPES.FAMILY_VALUES,
        targetId: userId,
        clientIp,
      });
      return findMine(userId);
    },

    /** Retirar o aceite (art. 8 §5) apaga as escolhas; o vocabulario fica, sem dono. */
    async removeMine({ userId, clientIp }) {
      const removed = await repository.removeAll(userId);
      if (removed === 0) return;
      await audit.record({
        actorId: userId,
        action: AUDIT_ACTIONS.FAMILY_VALUES_DELETED,
        targetType: AUDIT_TARGET_TYPES.FAMILY_VALUES,
        targetId: userId,
        clientIp,
      });
    },

    listOptions: (kind) => repository.listOptions(kind),
  };
}
