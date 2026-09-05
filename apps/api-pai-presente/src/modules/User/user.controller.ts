/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { HTTP_METHODS } from '../shared/http/http.constant';
import { parseJsonBody } from '../shared/http/request.util';
import { respondWithData } from '../shared/http/response.util';
import type { RouteDefinition } from '../shared/http/route.types';
import { updateUserBodySchema } from './user.schema';
import type { UserUseCases } from './user.use-case';

const ME_PATH = '/v1/me';

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
  ];
}
