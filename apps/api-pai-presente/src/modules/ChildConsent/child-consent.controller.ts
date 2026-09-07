/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { HTTP_METHODS, HTTP_STATUS } from '../shared/http/http.constant';
import { parseJsonBody, parseWithSchema, readClientIp } from '../shared/http/request.util';
import {
  respondWithData,
  respondWithList,
  respondWithNoContent,
} from '../shared/http/response.util';
import type { RouteDefinition } from '../shared/http/route.types';
import { uuidSchema } from '../shared/shared.schema';
import { CHILD_CONSENTS_PATH, CHILD_CONSENT_PATH } from './child-consent.constant';
import { childConsentPurposeSchema, grantChildConsentBodySchema } from './child-consent.schema';
import type { ChildConsentUseCases } from './child-consent.use-case';

export function buildChildConsentRoutes(
  useCases: ChildConsentUseCases,
): readonly RouteDefinition[] {
  return [
    {
      method: HTTP_METHODS.GET,
      path: CHILD_CONSENTS_PATH,
      summary: 'Lista os consentimentos vigentes de um filho.',
      handle: async ({ pathParams, authenticatedUser }) => {
        const childId = parseWithSchema(uuidSchema, pathParams.childId);
        const items = await useCases.list({ childId, userId: authenticatedUser.userId });
        /**
         * Sem paginacao de proposito: a lista tem uma linha por finalidade, e o
         * numero de finalidades e' do produto, nao do pai. Paginar isto pediria
         * ao cliente que percorresse paginas de um conjunto que ele conhece
         * inteiro — e a tela do `H5.3` precisa dele inteiro para decidir.
         */
        return respondWithList(items, { total: items.length, page: 1, perPage: items.length });
      },
    },
    {
      method: HTTP_METHODS.POST,
      path: CHILD_CONSENTS_PATH,
      summary: 'Registra o consentimento do art. 14 §1 para uma finalidade.',
      handle: async ({ request, pathParams, authenticatedUser }) => {
        const childId = parseWithSchema(uuidSchema, pathParams.childId);
        const { purpose } = await parseJsonBody(request, grantChildConsentBodySchema);
        const consent = await useCases.grant({
          childId,
          userId: authenticatedUser.userId,
          purpose,
          clientIp: readClientIp(request),
        });
        return respondWithData(consent, HTTP_STATUS.CREATED);
      },
    },
    {
      method: HTTP_METHODS.DELETE,
      path: CHILD_CONSENT_PATH,
      summary: 'Retira o consentimento de uma finalidade (art. 8 §5).',
      handle: async ({ request, pathParams, authenticatedUser }) => {
        const childId = parseWithSchema(uuidSchema, pathParams.childId);
        const purpose = parseWithSchema(childConsentPurposeSchema, pathParams.purpose);
        await useCases.revoke({
          childId,
          userId: authenticatedUser.userId,
          purpose,
          clientIp: readClientIp(request),
        });
        return respondWithNoContent();
      },
    },
  ];
}
