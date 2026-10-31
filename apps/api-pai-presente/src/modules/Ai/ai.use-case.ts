/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { formatMonth } from '../shared/date.util';
import { NoChildrenRegisteredError } from './ai.error';
import {
  buildChatPrompt,
  buildInsightsPrompt,
  buildReportPrompt,
  buildSuggestionsPrompt,
  buildMentorSystemPrompt,
} from './ai.prompt';
import {
  insightsOutputSchema,
  reportOutputSchema,
  suggestionsOutputSchema,
  toProviderJsonSchema,
  type ChatBody,
  type GenerateInsightsBody,
  type GenerateReportBody,
  type GenerateSuggestionsBody,
  type InsightsOutput,
  type ReportOutput,
  type SuggestionsOutput,
} from './ai.schema';
import { parseProviderPayload } from './providers/provider.util';
import { summarizeActivities, summarizeInsights } from './ai.summary';
import type { AiDependencies, ChildContext } from './types/ai.types';

/** O id do insight e do SERVIDOR: e ele que a nota do pai referencia depois. */
export type GeneratedInsight = InsightsOutput['insights'][number] & { readonly id: string };

export type AiUseCases = {
  generateInsights(params: {
    readonly userId: string;
    readonly values: GenerateInsightsBody;
  }): Promise<readonly GeneratedInsight[]>;
  suggestActivities(params: {
    readonly userId: string;
    readonly values: GenerateSuggestionsBody;
  }): Promise<SuggestionsOutput['suggestions']>;
  generateReport(params: {
    readonly userId: string;
    readonly values: GenerateReportBody;
  }): Promise<ReportOutput>;
  chat(params: { readonly userId: string; readonly values: ChatBody }): Promise<{ reply: string }>;
};

export function createAiUseCases({
  provider,
  children,
  activities,
  insights,
}: AiDependencies): AiUseCases {
  async function requireChildren(userId: string): Promise<readonly ChildContext[]> {
    const registered = await children.listByUser(userId);
    if (registered.length === 0) throw new NoChildrenRegisteredError();
    return registered;
  }

  return {
    async generateInsights({ userId, values }) {
      const registered = await requireChildren(userId);
      const raw = await provider.generateStructured({
        systemPrompt: buildMentorSystemPrompt(values.locale),
        userPrompt: buildInsightsPrompt({ children: registered, category: values.category }),
        schemaName: 'insights',
        jsonSchema: toProviderJsonSchema(insightsOutputSchema),
      });
      const parsed = parseProviderPayload(insightsOutputSchema, raw);
      return parsed.insights.map((insight) => ({ ...insight, id: crypto.randomUUID() }));
    },

    async suggestActivities({ userId, values }) {
      const registered = await requireChildren(userId);
      const month = values.month ?? formatMonth(new Date());
      const raw = await provider.generateStructured({
        systemPrompt: buildMentorSystemPrompt(values.locale),
        userPrompt: buildSuggestionsPrompt({ children: registered, month }),
        schemaName: 'suggestions',
        jsonSchema: toProviderJsonSchema(suggestionsOutputSchema),
      });
      return parseProviderPayload(suggestionsOutputSchema, raw).suggestions;
    },

    async generateReport({ userId, values }) {
      const registered = await requireChildren(userId);
      const { month } = values;
      const [activityRows, insightRows] = await Promise.all([
        activities.listMonth({ userId, month }),
        insights.listMonth({ userId, month }),
      ]);
      const raw = await provider.generateStructured({
        systemPrompt: buildMentorSystemPrompt(values.locale),
        userPrompt: buildReportPrompt({
          children: registered,
          month,
          activities: summarizeActivities(activityRows),
          insights: summarizeInsights(insightRows),
        }),
        schemaName: 'report',
        jsonSchema: toProviderJsonSchema(reportOutputSchema),
      });
      return parseProviderPayload(reportOutputSchema, raw);
    },

    /** Conversa nao exige filho cadastrado: a primeira pergunta costuma vir antes. */
    async chat({ userId, values }) {
      const registered = await children.listByUser(userId);
      const reply = await provider.generateText({
        systemPrompt: buildMentorSystemPrompt(values.locale),
        userPrompt: buildChatPrompt({ children: registered, message: values.message }),
      });
      return { reply };
    },
  };
}
