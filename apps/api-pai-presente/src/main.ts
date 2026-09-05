/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { environment } from './config/environment';
import { createDatabaseClient } from './database/client';
import { buildApplicationRoutes } from './app';
import { buildAuthModule } from './modules/Auth/auth.module';
import { createCorsPolicy } from './modules/shared/http/cors';
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

const isProduction = environment.NODE_ENV === 'production';
const auth = buildAuthModule({
  database,
  jwtSecret: environment.AUTH_JWT_SECRET,
  clientIds: { google: environment.GOOGLE_CLIENT_ID, apple: environment.APPLE_CLIENT_ID },
  // `Secure` sai de NODE_ENV, nao de uma variavel propria: variavel esquecida
  // no painel nao pode ser o que manda o cookie de sessao viajar em claro.
  isSecureCookie: isProduction,
});

const router = createRouter({
  routes: buildApplicationRoutes({
    database,
    llm: {
      providerName: environment.LLM_PROVIDER,
      apiKey: environment.LLM_API_KEY,
      model: environment.LLM_MODEL,
    },
  }),
  publicRoutes: auth.publicRoutes,
  authenticatedUserResolver: auth.authenticatedUserResolver,
});
const cors = createCorsPolicy(environment.WEB_ORIGINS);

// /health fica FORA da tabela de rotas de proposito: assim toda rota da tabela e
// autenticada por construcao, e nao por lembrar de marcar cada uma.
const server = Bun.serve({
  port: environment.API_PORT,
  async fetch(request: Request): Promise<Response> {
    const intercepted = cors.intercept(request);
    if (intercepted !== undefined) return intercepted;

    const url = new URL(request.url);
    if (url.pathname === HEALTH_PATH && request.method === HTTP_METHODS.GET) {
      return cors.decorate(request, respondWithData({ status: 'ok' }));
    }
    return cors.decorate(request, await router.handle(request));
  },
});

logger.info('api no ar', { port: server.port, nodeEnv: environment.NODE_ENV });

function shutdown(signal: string): void {
  logger.info('encerrando', { signal });
  const forceExit = setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();
  void server.stop(true).then(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
