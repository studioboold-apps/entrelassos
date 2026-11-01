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
export const CHAT_TRANSCRIPTION_PATH = '/v1/chat/transcriptions';

/**
 * Quantas falas anteriores viajam com a pergunta. Vinte cobrem a conversa do
 * dia sem transformar cada pergunta numa chamada cara: cada fala tem teto de
 * `FREE_TEXT_MAX_LENGTH`, entao o pior caso continua limitado.
 */
export const CHAT_HISTORY_LIMIT = 20;

/**
 * Foto no chat. O teto vale para o BASE64, que e' o que o provedor mede. O
 * app reduz a foto antes de mandar (lado maior em `1568px`, o que o modelo
 * enxerga sem desperdicio), entao o normal fica muito abaixo disto.
 */
export const CHAT_IMAGE_MAX_BASE64_LENGTH = 5 * 1024 * 1024;
export const CHAT_IMAGE_MAX_COUNT = 3;
/** So' o que os dois provedores aceitam como imagem. HEIC o app converte antes. */
export const CHAT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/**
 * Audio do chat: o pai grava, o servidor transcreve, e o TEXTO volta para a
 * caixa de pergunta — o audio nao e' guardado em lugar nenhum. Dez megabytes
 * cobrem alguns minutos de voz em opus/aac.
 */
export const CHAT_AUDIO_MAX_BYTES = 10 * 1024 * 1024;
export const CHAT_AUDIO_FORM_FIELD = 'audio';
/** Ha' alguem olhando a tela: o pacote recomenda ~15 s nesse caso; 30 s cobre o audio de 2 min. */
export const TRANSCRIPTION_TIMEOUT_MS = 30_000;

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

export const LLM_TIMEOUT_MS = 60_000;

/**
 * Busca na web das sugestoes da regiao: e' um extra. Se demorar mais que isto
 * ou falhar, a sugestao sai sem ela, como antes.
 */
export const WEB_SEARCH_TIMEOUT_MS = 35_000;
export const WEB_SEARCH_MAX_USES = 3;
export const ANTHROPIC_WEB_SEARCH_TOOL = 'web_search_20250305';
export const LLM_MAX_OUTPUT_TOKENS = 2048;

export const ANTHROPIC_BASE_URL = 'https://api.anthropic.com/v1/messages';
export const ANTHROPIC_API_VERSION = '2023-06-01';
export const OPENAI_BASE_URL = 'https://api.openai.com/v1/chat/completions';

/** O nome do modelo muda mais que o codigo; sai do env, com um padrao util. */
export const DEFAULT_MODELS = {
  anthropic: 'claude-sonnet-4-5',
  openai: 'gpt-4o-mini',
} as const satisfies Record<LlmProviderName, string>;
