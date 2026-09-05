/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { readServerEnvironment } from './environment.js';
import { createWebServer } from './web.server.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

const server = createWebServer(readServerEnvironment(process.env));

function shutdown() {
  const forceExit = setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();
  void server.stop(true).then(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
