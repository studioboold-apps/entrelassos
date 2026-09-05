/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
} as const;
export type LogLevel = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS];

export const APP_NAME = 'api-pai-presente';

export const REDACTED = '[REDACTED]';

/**
 * A redacao mora no logger, nao na disciplina de quem escreve o log
 * (security.md §1). Conteudo de conversa e nome completo nunca saem daqui.
 */
export const REDACTED_KEYS: readonly string[] = [
  'authorization',
  'cookie',
  'x-api-key',
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'email',
  'fullName',
  'content',
  'feedback',
  'description',
];
