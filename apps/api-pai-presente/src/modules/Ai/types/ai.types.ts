/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { LlmProviderName } from '../ai.constant';

/** Uma linha por mes de trabalho; o modulo Ai nunca ve a tabela do outro. */
export type ActivityDigestRow = {
  readonly category: string | null;
  readonly isCompleted: boolean;
  readonly rating: number | null;
};

export type InsightDigestRow = {
  readonly category: string;
  readonly rating: number;
};

export type MonthDigestParams = {
  readonly userId: string;
  readonly month: string;
};

export type ActivityDigestPort = {
  listMonth(params: MonthDigestParams): Promise<readonly ActivityDigestRow[]>;
};

export type InsightDigestPort = {
  listMonth(params: MonthDigestParams): Promise<readonly InsightDigestRow[]>;
};

export type ChildContext = {
  readonly name: string;
  readonly age: number;
  readonly gender: string;
};

/** Cidade que o pai escreveu no perfil; base das sugestoes da regiao. */
export type ParentRegionPort = {
  findCity(userId: string): Promise<string | undefined>;
};

export type ChildrenContextPort = {
  listByUser(userId: string): Promise<readonly ChildContext[]>;
};

export type ActivitySummary = {
  readonly total: number;
  readonly completed: number;
  readonly completionRate: number;
  readonly averageRating: number | undefined;
  readonly countByCategory: ReadonlyMap<string, number>;
};

export type InsightSummary = {
  readonly ratedCount: number;
  readonly averageRating: number | undefined;
  readonly averageByCategory: ReadonlyMap<string, number>;
};

/** Uma fala ja dita na conversa, na ordem em que foi dita. */
export type LlmTurn = {
  readonly role: 'user' | 'assistant';
  readonly content: string;
};

/** Imagem que acompanha a pergunta atual; `data` e' base64 sem prefixo `data:`. */
export type LlmImage = {
  readonly mediaType: string;
  readonly data: string;
};

export type LlmTextRequest = {
  readonly systemPrompt: string;
  readonly userPrompt: string;
  /** Falas anteriores da conversa, da mais antiga para a mais recente. */
  readonly history?: readonly LlmTurn[];
  /** Imagens da pergunta ATUAL; as de falas antigas nao viajam de novo. */
  readonly images?: readonly LlmImage[];
};

export type LlmStructuredRequest = LlmTextRequest & {
  /** Nome do formato pedido; os dois provedores exigem um. */
  readonly schemaName: string;
  readonly jsonSchema: Record<string, unknown>;
};

/**
 * O provedor devolve `unknown`: quem valida e o mesmo schema Zod que gerou o
 * JSON Schema pedido. Confiar na palavra do provedor foi como a Base44 servia
 * tela quebrada quando o modelo respondia fora do formato.
 */
export type LlmProvider = {
  readonly name: LlmProviderName;
  generateText(request: LlmTextRequest): Promise<string>;
  generateStructured(request: LlmStructuredRequest): Promise<unknown>;
};

export type ChatHistoryParams = {
  readonly userId: string;
  readonly conversationId: string;
  readonly limit: number;
};

/** Leitura estreita das ultimas falas; o modulo Ai nunca ve a tabela de mensagens. */
export type ChatHistoryPort = {
  listRecent(params: ChatHistoryParams): Promise<readonly LlmTurn[]>;
};

export type TranscriptionRequest = {
  readonly audio: Uint8Array;
  readonly format: { readonly contentType: string; readonly extension: string };
};

/** Voz vira texto. A Anthropic nao ouve audio, entao e' um provedor a parte. */
export type SpeechTranscriber = {
  transcribe(request: TranscriptionRequest): Promise<string>;
};

export type AiDependencies = {
  readonly provider: LlmProvider;
  readonly children: ChildrenContextPort;
  readonly chatHistory: ChatHistoryPort;
  readonly transcriber: SpeechTranscriber;
  readonly activities: ActivityDigestPort;
  readonly insights: InsightDigestPort;
  /** Opcional: sem ela, as sugestoes saem sem regiao, como antes. */
  readonly region?: ParentRegionPort;
};
