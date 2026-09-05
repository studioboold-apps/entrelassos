/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import {
  APP_NAME,
  LOG_LEVELS,
  PII_VALUE_PATTERNS,
  REDACTED,
  REDACTED_KEYS,
  normalizeLogKey,
  type LogLevel,
} from './logger.constant';

export type LogMeta = Readonly<Record<string, unknown>>;

export type CreateLoggerParams = {
  readonly traceId: string;
  /** Modulo que emite a linha: `router`, `ai-provider`, `boot`. */
  readonly source: string;
  /** Biblioteca por tras, quando houver: `drizzle`, `bun-sql`. */
  readonly lib?: string;
};

export type Logger = {
  error(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  info(message: string, meta?: LogMeta): void;
  debug(message: string, meta?: LogMeta): void;
  /** Empilha um escopo em `traceStack`, sem trocar a origem. */
  withScope(scope: string): Logger;
};

/** Mascara o que veio grudado numa frase — e-mail, CPF, telefone. */
function redactText(value: string): string {
  return PII_VALUE_PATTERNS.reduce((text, pattern) => text.replace(pattern, REDACTED), value);
}

function redactValue(value: unknown): unknown {
  if (typeof value === 'string') return redactText(value);
  if (Array.isArray(value)) return value.map(redactValue);
  if (typeof value === 'object' && value !== null) return redact(value as LogMeta);
  return value;
}

function redact(meta: LogMeta): LogMeta {
  const entries = Object.entries(meta).map(([key, value]) => {
    if (REDACTED_KEYS.has(normalizeLogKey(key))) return [key, REDACTED] as const;
    return [key, redactValue(value)] as const;
  });
  return Object.fromEntries(entries);
}

type WriteLineParams = {
  readonly identity: CreateLoggerParams;
  readonly traceStack: readonly string[];
  readonly level: LogLevel;
  readonly message: string;
  readonly meta: LogMeta;
};

/**
 * Uma linha, um JSON, na ordem da mascara do code-standart.md §11. Linha
 * quebrada em duas chega ao coletor como dois eventos, e o segundo nao tem
 * `traceId` nenhum.
 */
function writeLine({ identity, traceStack, level, message, meta }: WriteLineParams): void {
  const line = JSON.stringify({
    traceId: identity.traceId,
    timestamp: new Date().toISOString(),
    appName: APP_NAME,
    traceStack,
    source: identity.source,
    lib: identity.lib ?? '',
    level,
    message: redactText(message),
    meta: redact(meta),
  });
  process.stdout.write(`${line}\n`);
}

function buildLogger(identity: CreateLoggerParams, traceStack: readonly string[]): Logger {
  const emit =
    (level: LogLevel) =>
    (message: string, meta: LogMeta = {}): void =>
      writeLine({ identity, traceStack, level, message, meta });

  return {
    error: emit(LOG_LEVELS.ERROR),
    warn: emit(LOG_LEVELS.WARN),
    info: emit(LOG_LEVELS.INFO),
    debug: emit(LOG_LEVELS.DEBUG),
    withScope: (scope) => buildLogger(identity, [...traceStack, scope]),
  };
}

export function createLogger(params: CreateLoggerParams): Logger {
  return buildLogger(params, []);
}
