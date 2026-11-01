/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { HTTP_METHODS } from '../shared/http/http.constant';
import { parseJsonBody, parseWithSchema, readClientIp } from '../shared/http/request.util';
import { respondWithData, respondWithNoContent } from '../shared/http/response.util';
import type { RouteDefinition } from '../shared/http/route.types';
import { FAMILY_VALUE_OPTIONS_PATH, FAMILY_VALUES_PATH } from './family-values.constant';
import { listFamilyValueOptionsQuerySchema, saveFamilyValuesBodySchema } from './family-values.schema';
import type { FamilyValuesUseCases } from './family-values.use-case';

export function buildFamilyValuesRoutes(useCases: FamilyValuesUseCases): readonly RouteDefinition[] {
  return [
    {
      method: HTTP_METHODS.GET,
      path: FAMILY_VALUES_PATH,
      summary: 'Le os valores da familia que o pai escolheu informar.',
      handle: async ({ authenticatedUser }) => respondWithData(await useCases.findMine(authenticatedUser.userId)),
    },
    {
      method: HTTP_METHODS.PUT,
      path: FAMILY_VALUES_PATH,
      summary: 'Grava os valores da familia, com o consentimento do art. 11.',
      handle: async ({ request, authenticatedUser }) => {
        const values = await parseJsonBody(request, saveFamilyValuesBodySchema);
        const saved = await useCases.saveMine({
          userId: authenticatedUser.userId,
          values,
          clientIp: readClientIp(request),
        });
        return respondWithData(saved);
      },
    },
    {
      method: HTTP_METHODS.DELETE,
      path: FAMILY_VALUES_PATH,
      summary: 'Apaga os valores da familia e retira o consentimento.',
      handle: async ({ request, authenticatedUser }) => {
        await useCases.removeMine({ userId: authenticatedUser.userId, clientIp: readClientIp(request) });
        return respondWithNoContent();
      },
    },
    {
      method: HTTP_METHODS.GET,
      path: FAMILY_VALUE_OPTIONS_PATH,
      summary: 'Sugestoes para o campo livre: sementes e respostas de mais de um pai.',
      handle: async ({ url }) => {
        const { kind } = parseWithSchema(listFamilyValueOptionsQuerySchema, Object.fromEntries(url.searchParams));
        return respondWithData(await useCases.listOptions(kind));
      },
    },
  ];
}
