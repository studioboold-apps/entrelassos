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

export type LlmTextRequest = {
  readonly systemPrompt: string;
  readonly userPrompt: string;
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

export type AiDependencies = {
  readonly provider: LlmProvider;
  readonly children: ChildrenContextPort;
  readonly activities: ActivityDigestPort;
  readonly insights: InsightDigestPort;
};
