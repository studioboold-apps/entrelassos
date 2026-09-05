/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { HTTP_METHODS } from '../shared/http/http.constant';
import { parseJsonBody, readClientIp } from '../shared/http/request.util';
import { respondWithData, respondWithNoContent } from '../shared/http/response.util';
import type { RouteDefinition } from '../shared/http/route.types';
import { ME_EXPORT_PATH, ME_PATH } from './user.constant';
import { updateUserBodySchema } from './user.schema';
import type { UserUseCases } from './user.use-case';

export function buildUserRoutes(useCases: UserUseCases): readonly RouteDefinition[] {
  return [
    {
      method: HTTP_METHODS.GET,
      path: ME_PATH,
      summary: 'Devolve o perfil do usuario autenticado.',
      handle: async ({ authenticatedUser }) => {
        const user = await useCases.findMe({ userId: authenticatedUser.userId });
        return respondWithData(user);
      },
    },
    {
      method: HTTP_METHODS.PATCH,
      path: ME_PATH,
      summary: 'Atualiza o perfil do usuario autenticado.',
      handle: async ({ request, authenticatedUser }) => {
        const values = await parseJsonBody(request, updateUserBodySchema);
        const user = await useCases.updateMe({ userId: authenticatedUser.userId, values });
        return respondWithData(user);
      },
    },
    {
      method: HTTP_METHODS.DELETE,
      path: ME_PATH,
      summary: 'Apaga a conta e tudo o que ela produziu (LGPD art. 18 VI).',
      handle: async ({ request, authenticatedUser }) => {
        await useCases.deleteMe({
          userId: authenticatedUser.userId,
          clientIp: readClientIp(request),
        });
        return respondWithNoContent();
      },
    },
    {
      method: HTTP_METHODS.GET,
      path: ME_EXPORT_PATH,
      summary: 'Devolve em JSON tudo o que a conta guarda (LGPD art. 18 V).',
      handle: async ({ request, authenticatedUser }) => {
        const account = await useCases.exportMe({
          userId: authenticatedUser.userId,
          clientIp: readClientIp(request),
        });
        return respondWithData(account);
      },
    },
  ];
}
