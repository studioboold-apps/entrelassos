/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '../Audit/audit.constant';
import { ERROR_CODES } from '../shared/errors/codes';
import { ResourceNotFoundError } from '../shared/errors/shared.error';
import type { ChildConsentPort } from '../shared/child-consent.interface';
import type { ChildConsentRow } from './child-consent.table';
import type {
  ChildConsentUseCasesParams,
  ChildConsentView,
  GrantChildConsentParams,
  ListChildConsentsParams,
  RevokeChildConsentParams,
} from './types/child-consent.types';

export function toChildConsentView(row: ChildConsentRow): ChildConsentView {
  return { childId: row.childId, purpose: row.purpose, grantedAt: row.grantedAt };
}

export type ChildConsentUseCases = ChildConsentPort & {
  grant(params: GrantChildConsentParams): Promise<ChildConsentView>;
  list(params: ListChildConsentsParams): Promise<readonly ChildConsentView[]>;
  revoke(params: RevokeChildConsentParams): Promise<void>;
};

export function createChildConsentUseCases({
  repository,
  childOwnership,
  audit,
}: ChildConsentUseCasesParams): ChildConsentUseCases {
  /**
   * 404 e nao 403, e por um motivo de forma: o `childId` chega no CAMINHO, e um
   * 403 ali confirmaria a existencia do filho de outra pessoa a quem so' chutou
   * o id. `Activity` responde 403 no caso equivalente porque lah o id vem no
   * CORPO, onde o caminho nao vaza nada.
   */
  async function assertChildIsOwned(childId: string, userId: string): Promise<void> {
    const isOwned = await childOwnership.isOwnedByUser({ childId, userId });
    if (isOwned) return;
    throw new ResourceNotFoundError(ERROR_CODES.child.CHILD_NOT_FOUND, 'Filho nao encontrado.');
  }

  return {
    async grant({ childId, userId, purpose, clientIp }): Promise<ChildConsentView> {
      await assertChildIsOwned(childId, userId);
      const granted = await repository.grant({ childId, userId, purpose });
      await audit.record({
        actorId: userId,
        action: AUDIT_ACTIONS.CHILD_CONSENT_GRANTED,
        targetType: AUDIT_TARGET_TYPES.CHILD_CONSENT,
        targetId: granted.id,
        clientIp,
      });
      return toChildConsentView(granted);
    },

    async list({ childId, userId }): Promise<readonly ChildConsentView[]> {
      await assertChildIsOwned(childId, userId);
      const rows = await repository.listByChild({ childId, userId });
      return rows.map(toChildConsentView);
    },

    /**
     * Revogar existe porque o art. 8 §5 diz que o consentimento pode ser
     * retirado a qualquer momento: consentimento que nao se desfaz nao e'
     * consentimento, e' um aceite de uma vez. A task pedia so' a concessao; sem
     * este caminho o produto teria uma porta que so' abre.
     *
     * O que revogar NAO faz e' apagar exame ja guardado — isso e' o art. 18, e
     * tem rota propria (`DELETE` do arquivo). Misturar as duas coisas faria um
     * clique de "retirar consentimento" destruir o historico de saude do filho
     * sem ninguem ter pedido isso.
     */
    async revoke({ childId, userId, purpose, clientIp }): Promise<void> {
      await assertChildIsOwned(childId, userId);
      const revoked = await repository.revoke({ childId, userId, purpose });
      if (revoked === undefined) {
        throw new ResourceNotFoundError(
          ERROR_CODES.childConsent.CHILD_CONSENT_NOT_FOUND,
          'Consentimento nao encontrado.',
        );
      }
      await audit.record({
        actorId: userId,
        action: AUDIT_ACTIONS.CHILD_CONSENT_REVOKED,
        targetType: AUDIT_TARGET_TYPES.CHILD_CONSENT,
        targetId: revoked.id,
        clientIp,
      });
    },

    /**
     * O lado LEITOR da porta (`ChildConsentPort`), no mesmo caso de uso que
     * escreve. Sem dono eleito nao ha duas respostas para a mesma pergunta: se
     * `ChildFile` tivesse sua propria consulta, as duas concordariam so' ate a
     * primeira edicao (`code-standart.md` §16).
     *
     * Aqui NAO se afirma a posse do filho: quem pergunta e' um modulo que ja
     * afirmou, e repetir a checagem custaria uma consulta por upload para
     * responder o que o chamador acabou de responder.
     */
    async hasConsent({ childId, userId, purpose }): Promise<boolean> {
      const found = await repository.findOne({ childId, userId, purpose });
      return found !== undefined;
    },
  };
}
