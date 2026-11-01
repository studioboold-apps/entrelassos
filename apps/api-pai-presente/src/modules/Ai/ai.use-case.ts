/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { formatMonth, parseMonth } from '../shared/date.util';
import { detectAudioFormat } from './ai.audio';
import { AudioInvalidError, NoChildrenRegisteredError } from './ai.error';
import {
  buildChatPrompt,
  buildInsightsPrompt,
  buildReportPrompt,
  buildSuggestionsPrompt,
  INSIGHTS_SYSTEM_PROMPT,
  MENTOR_SYSTEM_PROMPT,
  REPORT_SYSTEM_PROMPT,
  SUGGESTIONS_SYSTEM_PROMPT,
} from './ai.prompt';
import {
  insightsOutputSchema,
  reportNarrativeSchema,
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
import { isOffTopic, OFF_TOPIC_REPLY } from './ai.topic-guard';
import { computeReportGrade, summarizeActivities, summarizeInsights } from './ai.summary';
import { CHAT_HISTORY_LIMIT, RECENT_ACTIVITY_LIMIT } from './ai.constant';
import type {
  ActivityDigestRow,
  AiDependencies,
  ChildContext,
  InsightSummary,
  LlmTurn,
} from './types/ai.types';

/** `YYYY-MM` do mes anterior; janeiro volta para dezembro do ano passado. */
export function previousMonth(month: string): string {
  const { year, monthNumber } = parseMonth(month);
  return monthNumber === 1
    ? `${year - 1}-12`
    : `${year}-${String(monthNumber - 1).padStart(2, '0')}`;
}

/**
 * O app grava a pergunta ANTES de chamar a IA (para ela nao sumir se a IA
 * falhar), entao a ultima fala gravada e' a propria pergunta atual. Ela sai
 * daqui e volta como a fala nova, com os filhos e a foto junto. Perguntas
 * antigas que ficaram sem resposta (a IA falhou) saem com ela: repeti-las faria
 * o mentor responder o que o pai ja deixou para tras.
 */
function dropUnansweredTail(turns: readonly LlmTurn[]): readonly LlmTurn[] {
  let end = turns.length;
  while (end > 0 && turns[end - 1]?.role === 'user') end -= 1;
  return turns.slice(0, end);
}

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
  transcribe(params: { readonly audio: Uint8Array }): Promise<{ text: string }>;
};

export function createAiUseCases({
  provider,
  children,
  activities,
  insights,
  chatHistory,
  transcriber,
  region,
}: AiDependencies): AiUseCases {
  async function requireChildren(userId: string): Promise<readonly ChildContext[]> {
    const registered = await children.listByUser(userId);
    if (registered.length === 0) throw new NoChildrenRegisteredError();
    return registered;
  }

  /** Porta opcional: sem ela, os prompts saem sem historico, como antes. */
  async function listRecentActivities(userId: string): Promise<readonly ActivityDigestRow[]> {
    return (await activities.listRecent?.({ userId, limit: RECENT_ACTIVITY_LIMIT })) ?? [];
  }

  /** Notas dos insights deste mes e do anterior: o que o pai achou util ou nao. */
  async function recentInsightFeedback(userId: string): Promise<InsightSummary> {
    const month = formatMonth(new Date());
    const [current, previous] = await Promise.all([
      insights.listMonth({ userId, month }),
      insights.listMonth({ userId, month: previousMonth(month) }),
    ]);
    return summarizeInsights([...previous, ...current]);
  }

  return {
    async generateInsights({ userId, values }) {
      const [registered, recentActivities, feedback] = await Promise.all([
        requireChildren(userId),
        listRecentActivities(userId),
        recentInsightFeedback(userId),
      ]);
      const raw = await provider.generateStructured({
        task: 'insights',
        systemPrompt: INSIGHTS_SYSTEM_PROMPT,
        userPrompt: buildInsightsPrompt({
          children: registered,
          category: values.category,
          recentActivities,
          feedback,
        }),
        schemaName: 'insights',
        jsonSchema: toProviderJsonSchema(insightsOutputSchema),
      });
      const parsed = parseProviderPayload(insightsOutputSchema, raw);
      return parsed.insights.map((insight) => ({ ...insight, id: crypto.randomUUID() }));
    },

    async suggestActivities({ userId, values }) {
      const [registered, city, recentActivities] = await Promise.all([
        requireChildren(userId),
        region?.findCity(userId),
        listRecentActivities(userId),
      ]);
      const month = values.month ?? formatMonth(new Date());
      const raw = await provider.generateStructured({
        task: 'suggestions',
        systemPrompt: SUGGESTIONS_SYSTEM_PROMPT,
        userPrompt: buildSuggestionsPrompt({ children: registered, month, city, recentActivities }),
        schemaName: 'suggestions',
        jsonSchema: toProviderJsonSchema(suggestionsOutputSchema),
      });
      return parseProviderPayload(suggestionsOutputSchema, raw).suggestions;
    },

    async generateReport({ userId, values }) {
      const registered = await requireChildren(userId);
      const { month } = values;
      const [activityRows, insightRows, previousRows] = await Promise.all([
        activities.listMonth({ userId, month }),
        insights.listMonth({ userId, month }),
        activities.listMonth({ userId, month: previousMonth(month) }),
      ]);
      const activitySummary = summarizeActivities(activityRows);
      const grade = computeReportGrade(activitySummary);
      const previousGrade =
        previousRows.length === 0 ? undefined : computeReportGrade(summarizeActivities(previousRows));
      const raw = await provider.generateStructured({
        task: 'report',
        systemPrompt: REPORT_SYSTEM_PROMPT,
        userPrompt: buildReportPrompt({
          children: registered,
          month,
          activities: activitySummary,
          insights: summarizeInsights(insightRows),
          grade,
          monthActivities: activityRows,
          previousGrade,
        }),
        schemaName: 'report',
        jsonSchema: toProviderJsonSchema(reportNarrativeSchema),
      });
      return { grade, ...parseProviderPayload(reportNarrativeSchema, raw) };
    },

    /** Conversa nao exige filho cadastrado: a primeira pergunta costuma vir antes. */
    async chat({ userId, values }) {
      const [registered, recent] = await Promise.all([
        children.listByUser(userId),
        chatHistory.listRecent({
          userId,
          conversationId: values.conversationId ?? userId,
          limit: CHAT_HISTORY_LIMIT,
        }),
      ]);
      // Fora do tema e sem foto: resposta pronta, sem chamada paga.
      if (values.images.length === 0 && isOffTopic({ message: values.message, childNames: registered.map(({ name }) => name) })) {
        return { reply: OFF_TOPIC_REPLY };
      }
      const reply = await provider.generateText({
        task: 'chat',
        systemPrompt: MENTOR_SYSTEM_PROMPT,
        userPrompt: buildChatPrompt({
          children: registered,
          message: values.message,
          imageCount: values.images.length,
        }),
        history: dropUnansweredTail(recent),
        images: values.images,
      });
      return { reply };
    },

    /** O tipo sai dos BYTES; audio que nao reconhecemos nem chega ao provedor. */
    async transcribe({ audio }) {
      const format = detectAudioFormat(audio);
      if (format === undefined) throw new AudioInvalidError();
      const text = await transcriber.transcribe({ audio, format });
      return { text };
    },
  };
}
