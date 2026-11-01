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
 * Teto de SEGURANCA, nao de estilo: nos modelos 5.x o raciocinio interno conta
 * dentro dele, e bater no teto corta a resposta no meio. Quem deixa a resposta
 * curta e' o prompt (`CHAT_STYLE_RULES`), nao este numero.
 */
export const LLM_MAX_OUTPUT_TOKENS = 4096;

export const ANTHROPIC_BASE_URL = 'https://api.anthropic.com/v1/messages';
export const ANTHROPIC_API_VERSION = '2023-06-01';
/** Recusa do classificador de seguranca e' refeita no modelo indicado pela propria Anthropic. */
export const ANTHROPIC_FALLBACK_BETA = 'server-side-fallback-2026-07-01';
export const OPENAI_BASE_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Duas faixas de modelo. `main` responde o pai olhando a tela e escreve o
 * boletim (onde qualidade aparece); `fast` gera insights e sugestoes em lote,
 * onde um modelo barato rende o mesmo.
 */
export const LLM_TIERS = ['main', 'fast'] as const;
export type LlmTier = (typeof LLM_TIERS)[number];

/** Quanto o modelo pensa antes de responder; so' os modelos 5.x aceitam. */
export type LlmEffort = 'low' | 'medium' | 'high';

export const LLM_TASKS = ['chat', 'report', 'insights', 'suggestions'] as const;
export type LlmTask = (typeof LLM_TASKS)[number];

/**
 * Cada tarefa escolhe faixa e esforco. Conversa e' `low`: o pai quer resposta
 * rapida e o conteudo e' acolhimento, nao calculo. O boletim pensa um pouco
 * mais porque cruza numeros, atividades e o mes anterior.
 */
export const LLM_TASK_PROFILES = {
  chat: { tier: 'main', effort: 'low' },
  report: { tier: 'main', effort: 'medium' },
  insights: { tier: 'fast', effort: 'low' },
  suggestions: { tier: 'fast', effort: 'low' },
} as const satisfies Record<LlmTask, { tier: LlmTier; effort: LlmEffort }>;

/**
 * O nome do modelo muda mais que o codigo; sai do env, com um padrao util.
 * Haiku nas duas faixas: decisao do dono (31/10 e 01/11/2026) por custo e
 * velocidade. As faixas existem para trocar so' o chat/boletim, se um dia valer.
 */
export const DEFAULT_MODELS = {
  anthropic: { main: 'claude-haiku-5-5', fast: 'claude-haiku-5-5' },
  openai: { main: 'gpt-4o-mini', fast: 'gpt-4o-mini' },
} as const satisfies Record<LlmProviderName, Record<LlmTier, string>>;

/**
 * Atividades recentes que viajam com insights e sugestoes: o bastante para a
 * IA nao repetir o que o pai acabou de fazer, sem inflar o prompt.
 */
export const RECENT_ACTIVITY_LIMIT = 15;

/**
 * Regua da nota do boletim (0 a 10), calculada no SERVIDOR: o mesmo mes da' a
 * mesma nota sempre, e o modelo so' explica. Pesos:
 * - presenca (5): atividades concluidas, cheia em 8 no mes (~2 por semana);
 * - constancia (2): taxa de conclusao do que foi planejado;
 * - variedade (2): categorias diferentes, cheia em 4;
 * - satisfacao (1): nota media que o pai deu as atividades (neutra sem nota).
 */
export const REPORT_GRADE_RUBRIC = {
  presence: { weight: 5, target: 8 },
  consistency: { weight: 2 },
  variety: { weight: 2, target: 4 },
  satisfaction: { weight: 1, neutral: 0.5 },
  step: 0.5,
} as const;
