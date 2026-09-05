/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { APP_NAME, LOG_LEVELS, REDACTED, REDACTED_KEYS, type LogLevel } from './logger.constant';

export type LogMeta = Readonly<Record<string, unknown>>;

function redact(meta: LogMeta): LogMeta {
  const entries = Object.entries(meta).map(([key, value]) => {
    if (REDACTED_KEYS.includes(key)) return [key, REDACTED] as const;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return [key, redact(value as LogMeta)] as const;
    }
    return [key, value] as const;
  });
  return Object.fromEntries(entries);
}

function write(level: LogLevel, message: string, meta: LogMeta, traceId: string): void {
  const line = JSON.stringify({
    traceId,
    timestamp: new Date().toISOString(),
    appName: APP_NAME,
    level,
    message,
    meta: redact(meta),
  });
  process.stdout.write(`${line}\n`);
}

export type Logger = {
  error(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  info(message: string, meta?: LogMeta): void;
  debug(message: string, meta?: LogMeta): void;
};

export function createLogger(traceId: string): Logger {
  return {
    error: (message, meta = {}) => write(LOG_LEVELS.ERROR, message, meta, traceId),
    warn: (message, meta = {}) => write(LOG_LEVELS.WARN, message, meta, traceId),
    info: (message, meta = {}) => write(LOG_LEVELS.INFO, message, meta, traceId),
    debug: (message, meta = {}) => write(LOG_LEVELS.DEBUG, message, meta, traceId),
  };
}
