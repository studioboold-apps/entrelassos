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
import { uuidSchema } from '../shared/shared.schema';
import { detectContentType } from '../Media/detect-content-type';
import {
  CHAT_IMAGE_MAX_BASE64_LENGTH,
  CHAT_IMAGE_MAX_COUNT,
  CHAT_IMAGE_TYPES,
  REPORT_GRADE_MAX,
  REPORT_GRADE_MIN,
} from './ai.constant';

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

const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

/**
 * O tipo declarado pelo app e' texto do cliente: quem decide sao os BYTES
 * (`security.md` §3). Foto que diz ser JPEG e e' outra coisa nao chega ao
 * provedor — e nem gasta a chamada.
 */
const chatImageSchema = z
  .object({
    mediaType: z.enum(CHAT_IMAGE_TYPES),
    data: z.string().min(1).max(CHAT_IMAGE_MAX_BASE64_LENGTH).regex(BASE64_PATTERN, 'Imagem deve vir em base64.'),
  })
  .superRefine((image, context) => {
    const detected = detectContentType(Buffer.from(image.data.slice(0, 64), 'base64'));
    if (detected !== image.mediaType) {
      context.addIssue({ code: 'custom', path: ['data'], message: 'A imagem nao e do tipo declarado.' });
    }
  });

export const chatBodySchema = z
  .object({
    /** Pode vir vazia quando o pai so' manda a foto. */
    message: z.string().trim().max(FREE_TEXT_MAX_LENGTH).default(''),
    /**
     * Conversa cujas falas anteriores dao memoria ao mentor. Ausente, vale a
     * conversa unica do pai (o app usa o id do proprio pai como id dela).
     */
    conversationId: uuidSchema.optional(),
    images: z.array(chatImageSchema).max(CHAT_IMAGE_MAX_COUNT).default([]),
  })
  .refine((body) => body.message.length > 0 || body.images.length > 0, {
    path: ['message'],
    message: 'Escreva uma pergunta ou envie uma foto.',
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
      title: z.string().max(MEDIUM_TEXT_LENGTH).describe('Título curto, até 8 palavras.'),
      content: z
        .string()
        .max(FREE_TEXT_MAX_LENGTH)
        .describe('De 2 a 4 frases, com uma ação concreta para esta semana.'),
      category: z.enum(INSIGHT_CATEGORIES),
      /** Vazio quando o insight vale para todos os filhos. */
      childName: z
        .string()
        .max(MEDIUM_TEXT_LENGTH)
        .describe('Nome do filho, exatamente como cadastrado, ou vazio se vale para todos.'),
    }),
  ),
});
export type InsightsOutput = z.infer<typeof insightsOutputSchema>;

export const suggestionsOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      title: z.string().max(MEDIUM_TEXT_LENGTH).describe('Título curto, até 8 palavras.'),
      description: z
        .string()
        .max(FREE_TEXT_MAX_LENGTH)
        .describe('De 2 a 3 frases: o que fazer, do que precisa e quanto tempo leva.'),
      category: z.enum(ACTIVITY_CATEGORIES),
      childName: z
        .string()
        .max(MEDIUM_TEXT_LENGTH)
        .describe('Nome do filho, exatamente como cadastrado, ou vazio para a família.'),
    }),
  ),
});
export type SuggestionsOutput = z.infer<typeof suggestionsOutputSchema>;

const reportHighlightSchema = z.object({
  title: z.string().max(MEDIUM_TEXT_LENGTH).describe('Título curto.'),
  description: z.string().max(FREE_TEXT_MAX_LENGTH).describe('No máximo 2 frases.'),
});

/**
 * O que o MODELO escreve no boletim. A nota fica de fora: ela sai da regua do
 * servidor (`computeReportGrade`), e pedir ao modelo seria deixa-lo divergir.
 */
export const reportNarrativeSchema = z.object({
  strengths: z.array(reportHighlightSchema),
  improvements: z.array(reportHighlightSchema),
  motivationalMessage: z.string().max(FREE_TEXT_MAX_LENGTH).describe('Até 3 frases.'),
  nextMonthGoal: z
    .string()
    .max(FREE_TEXT_MAX_LENGTH)
    .describe('Uma meta concreta e alcançável, em 1 frase.'),
});

/** O boletim que a API devolve: a narrativa do modelo mais a nota do servidor. */
export const reportOutputSchema = reportNarrativeSchema.extend({
  grade: z.number().min(REPORT_GRADE_MIN).max(REPORT_GRADE_MAX),
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
