/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { environment } from './config/environment';
import { createDatabaseClient } from './database/client';
import { buildApplicationRoutes } from './app';
import { createDenyAllResolver } from './modules/shared/auth/deny-all.resolver';
import {
  HEALTH_PATH,
  HTTP_METHODS,
  SHUTDOWN_TIMEOUT_MS,
} from './modules/shared/http/http.constant';
import { respondWithData } from './modules/shared/http/response.util';
import { createRouter } from './modules/shared/http/router';
import { createLogger } from './modules/shared/logger/logger';

const logger = createLogger('boot');
const database = createDatabaseClient(environment.DATABASE_URL);
const router = createRouter({
  routes: buildApplicationRoutes(database),
  authenticatedUserResolver: createDenyAllResolver(),
});

// /health fica FORA da tabela de rotas de proposito: assim toda rota da tabela e
// autenticada por construcao, e nao por lembrar de marcar cada uma.
const server = Bun.serve({
  port: environment.API_PORT,
  fetch(request: Request): Response | Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === HEALTH_PATH && request.method === HTTP_METHODS.GET) {
      return respondWithData({ status: 'ok' });
    }
    return router.handle(request);
  },
});

logger.info('api no ar', { port: server.port, nodeEnv: environment.NODE_ENV });
logger.warn('sessao ainda nao implementada (TB.6): rotas /v1 respondem 401');

function shutdown(signal: string): void {
  logger.info('encerrando', { signal });
  const forceExit = setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();
  void server.stop(true).then(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
