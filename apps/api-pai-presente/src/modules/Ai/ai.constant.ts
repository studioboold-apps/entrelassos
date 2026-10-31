/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

export const LLM_PROVIDERS = ['anthropic', 'openai'] as const;
export type LlmProviderName = (typeof LLM_PROVIDERS)[number];

export const INSIGHTS_PATH = '/v1/insights';
export const ACTIVITY_SUGGESTIONS_PATH = '/v1/activity-suggestions';
export const REPORT_PATH = '/v1/report';
export const CHAT_PATH = '/v1/chat';

/** Um insight por categoria; pedindo UMA categoria, dois dela (Home.jsx). */
export const INSIGHTS_PER_CATEGORY = 1;
export const INSIGHTS_FOR_SINGLE_CATEGORY = 2;
export const ACTIVITY_SUGGESTION_COUNT = 4;
export const REPORT_HIGHLIGHT_COUNT = 3;

export const REPORT_GRADE_MIN = 0;
export const REPORT_GRADE_MAX = 10;

/**
 * Teto por usuario: cada chamada gasta dinheiro com terceiro, e conta invadida
 * sem teto gasta sozinha (security.md §3).
 */
export const AI_RATE_LIMIT = { maxRequests: 30, windowSeconds: 3600 } as const;

/** O relogio e do servidor: estacao vinda do cliente seria entrada de usuario. */
export const SEASONS_BY_MONTH = [
  'verao',
  'verao',
  'outono',
  'outono',
  'outono',
  'inverno',
  'inverno',
  'inverno',
  'primavera',
  'primavera',
  'primavera',
  'verao',
] as const;

/**
 * O idioma em que a IA escreve. Bate com `SUPPORTED_LOCALES` do frontend: e' o
 * idioma que o pai escolheu no perfil, e a resposta tem de falar a mesma lingua
 * que a tela em volta dela.
 */
export const AI_LOCALES = ['pt-BR', 'en', 'es'] as const;
export type AiLocale = (typeof AI_LOCALES)[number];
export const DEFAULT_AI_LOCALE: AiLocale = 'pt-BR';

/** Como o prompt (escrito em portugues) nomeia cada idioma. */
export const AI_LANGUAGE_NAMES = {
  'pt-BR': 'portugues do Brasil',
  en: 'ingles',
  es: 'espanhol',
} as const satisfies Record<AiLocale, string>;

export const LLM_TIMEOUT_MS = 60_000;
export const LLM_MAX_OUTPUT_TOKENS = 2048;

export const ANTHROPIC_BASE_URL = 'https://api.anthropic.com/v1/messages';
export const ANTHROPIC_API_VERSION = '2023-06-01';
export const OPENAI_BASE_URL = 'https://api.openai.com/v1/chat/completions';

/** O nome do modelo muda mais que o codigo; sai do env, com um padrao util. */
export const DEFAULT_MODELS = {
  anthropic: 'claude-sonnet-4-5',
  openai: 'gpt-4o-mini',
} as const satisfies Record<LlmProviderName, string>;
