/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { z } from 'zod';

import {
  ACTIVITY_CATEGORIES,
  FREE_TEXT_MAX_LENGTH,
  INSIGHT_CATEGORIES,
  MEDIUM_TEXT_LENGTH,
} from '../shared/shared.constant';
import { REPORT_GRADE_MAX, REPORT_GRADE_MIN } from './ai.constant';

/** `YYYY-MM`: o mes e do calendario, nao um instante com fuso. */
const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Mes deve ser YYYY-MM.');

export const generateInsightsBodySchema = z.object({
  category: z.enum(INSIGHT_CATEGORIES).optional(),
});
export type GenerateInsightsBody = z.infer<typeof generateInsightsBodySchema>;

export const generateSuggestionsBodySchema = z.object({
  month: monthSchema.optional(),
});
export type GenerateSuggestionsBody = z.infer<typeof generateSuggestionsBodySchema>;

export const generateReportBodySchema = z.object({
  month: monthSchema,
});
export type GenerateReportBody = z.infer<typeof generateReportBodySchema>;

export const chatBodySchema = z.object({
  message: z.string().trim().min(1).max(FREE_TEXT_MAX_LENGTH),
});
export type ChatBody = z.infer<typeof chatBodySchema>;

/**
 * Estes schemas sao a fonte UNICA do formato: o JSON Schema mandado ao provedor
 * sai deles por `z.toJSONSchema`, e a resposta volta validada pelo mesmo objeto.
 * Manter as duas coisas a mao foi como o formato pedido e o formato aceito
 * divergiram na Base44.
 */
export const insightsOutputSchema = z.object({
  insights: z.array(
    z.object({
      title: z.string().max(MEDIUM_TEXT_LENGTH),
      content: z.string().max(FREE_TEXT_MAX_LENGTH),
      category: z.enum(INSIGHT_CATEGORIES),
      /** Vazio quando o insight vale para todos os filhos. */
      childName: z.string().max(MEDIUM_TEXT_LENGTH),
    }),
  ),
});
export type InsightsOutput = z.infer<typeof insightsOutputSchema>;

export const suggestionsOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      title: z.string().max(MEDIUM_TEXT_LENGTH),
      description: z.string().max(FREE_TEXT_MAX_LENGTH),
      category: z.enum(ACTIVITY_CATEGORIES),
      childName: z.string().max(MEDIUM_TEXT_LENGTH),
    }),
  ),
});
export type SuggestionsOutput = z.infer<typeof suggestionsOutputSchema>;

const reportHighlightSchema = z.object({
  title: z.string().max(MEDIUM_TEXT_LENGTH),
  description: z.string().max(FREE_TEXT_MAX_LENGTH),
});

export const reportOutputSchema = z.object({
  grade: z.number().min(REPORT_GRADE_MIN).max(REPORT_GRADE_MAX),
  strengths: z.array(reportHighlightSchema),
  improvements: z.array(reportHighlightSchema),
  motivationalMessage: z.string().max(FREE_TEXT_MAX_LENGTH),
  nextMonthGoal: z.string().max(FREE_TEXT_MAX_LENGTH),
});
export type ReportOutput = z.infer<typeof reportOutputSchema>;

/**
 * O JSON Schema mandado ao provedor SAI do schema Zod acima — nao existe uma
 * segunda copia do formato para divergir. `$schema` cai fora: os dois
 * provedores recusam a chave dentro do objeto de formato.
 */
export function toProviderJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const { $schema: _ignored, ...rest } = z.toJSONSchema(schema, { io: 'output' }) as Record<
    string,
    unknown
  >;
  return rest;
}
