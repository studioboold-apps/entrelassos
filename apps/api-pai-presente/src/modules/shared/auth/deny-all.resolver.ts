/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { AuthenticatedUser, AuthenticatedUserResolver } from './authenticated-user.interface';

/**
 * Enquanto TB.6 nao entrega a sessao, NAO existe usuario autenticado: toda rota
 * responde 401. Devolver um usuario de mentira aqui abriria a API inteira sem
 * que nada falhasse em voz alta — o contrario do que fail-closed quer dizer.
 */
export function createDenyAllResolver(): AuthenticatedUserResolver {
  return {
    resolve: async (): Promise<AuthenticatedUser | undefined> => undefined,
  };
}
