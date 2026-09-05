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
 * (security.md §1). Este produto tem nome de crianca em quase toda tabela, e
 * quem escreve o log erra o nome do campo — dai a lista ser generosa.
 *
 * A comparacao e' NORMALIZADA (minuscula, sem `_` nem `-`): a coluna do banco e'
 * `full_name` e o DTO e' `fullName`, e uma lista que so conhece um dos dois
 * deixa o outro passar.
 */
const REDACTED_KEY_SOURCE: readonly string[] = [
  'authorization',
  'cookie',
  'x-api-key',
  'x-hub-signature-256',
  'password',
  'secret',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'email',
  'name',
  'fullName',
  'firstName',
  'lastName',
  'childName',
  'birthDate',
  'dateOfBirth',
  'phone',
  'phoneNumber',
  'cpf',
  'address',
  'content',
  'feedback',
  'description',
  'note',
  'notes',
  'title',
  'text',
  'prompt',
  'answer',
  'body',
] as const;

export function normalizeLogKey(key: string): string {
  return key.toLowerCase().replaceAll('_', '').replaceAll('-', '');
}

export const REDACTED_KEYS: ReadonlySet<string> = new Set(
  REDACTED_KEY_SOURCE.map(normalizeLogKey),
);

/**
 * Segunda linha de defesa, sobre o VALOR: a chave certa pega o campo declarado,
 * e isto pega o que veio grudado numa frase — `usuario pai@casa.br ja existe`.
 */
export const PII_VALUE_PATTERNS: readonly RegExp[] = [
  /[\w.+-]+@[\w-]+\.[\w.-]+/g,
  /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g,
  /\b\d{11}\b/g,
  /\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}\b/g,
];

/** A ordem da mascara do code-standart.md §11, e o coletor le por nome. */
export const LOG_FIELD_ORDER: readonly string[] = [
  'traceId',
  'timestamp',
  'appName',
  'traceStack',
  'source',
  'lib',
  'level',
  'message',
  'meta',
];
