/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { ACTIVITY_CATEGORIES, INSIGHT_CATEGORIES } from '../shared/shared.constant';
import { MONTH_NAMES, parseMonth } from '../shared/date.util';
import {
  ACTIVITY_SUGGESTION_COUNT,
  INSIGHTS_FOR_SINGLE_CATEGORY,
  INSIGHTS_PER_CATEGORY,
  REPORT_GRADE_MAX,
  REPORT_GRADE_MIN,
  REPORT_HIGHLIGHT_COUNT,
  SEASONS_BY_MONTH,
} from './ai.constant';
import type { ActivitySummary, ChildContext, InsightSummary } from './types/ai.types';

// A Base44 mandava orientacao religiosa e politica do pai em todo prompt. Sao
// dados sensiveis (LGPD art. 11) e nao existem no schema novo: enquanto TL.1
// nao decidir, o prompt nao os pede nem os usa.
//
// O texto vai ACENTUADO de proposito: o modelo imita a escrita do prompt, e um
// prompt sem acento devolvia boletim sem acento ("Voce planejou", "intencao").
// O feedback do design (nov/2026) apontou isso como erro de ortografia do app.
export const WRITING_RULES =
  'Escreva em português do Brasil com ortografia e acentuação corretas (você, ' +
  'intenção, experiências, culinária). Os nomes de categoria chegam sem acento ' +
  'porque são chaves do sistema: ao citá-los no texto, escreva a palavra acentuada.';

export const MENTOR_SYSTEM_PROMPT =
  'Você é um mentor de paternidade do Entrelaços — Pai Presente: especialista em desenvolvimento ' +
  'infantil, acolhedor e prático. Fale de forma simples, como um amigo experiente, ' +
  'sem julgar o pai, com conselhos aplicáveis no dia a dia e adequados à idade de cada ' +
  'filho. Nunca invente diagnóstico nem substitua um profissional de saúde. ' +
  'Use o que já foi dito na conversa: não peça de novo o que o pai já contou. ' +
  WRITING_RULES;

/**
 * Pai lê no celular, no meio do dia: a resposta precisa dar o geral numa olhada
 * e deixar o aprofundamento para depois. O app ainda corta a bolha com "ver
 * mais", mas o corte só funciona se o começo da resposta já for o resumo.
 */
export const CHAT_STYLE_RULES = [
  'Formato da resposta:',
  '- Comece com 1 ou 2 frases que já respondem o essencial.',
  '- Depois, no máximo 4 tópicos numerados, cada um com um título curto em negrito e 1 ou 2 frases.',
  '- Sem introduções longas nem repetição. Se o pai quiser mais, ele pergunta.',
].join('\n');

const NO_CHILDREN_LINE = 'O pai ainda não cadastrou filhos.';

function describeChildren(children: readonly ChildContext[]): string {
  if (children.length === 0) return NO_CHILDREN_LINE;
  return children
    .map((child) => `- ${child.name}, ${child.age} anos, ${child.gender}`)
    .join('\n');
}

function describeCounts(counts: ReadonlyMap<string, number>): string {
  if (counts.size === 0) return 'nenhuma';
  return [...counts].map(([category, total]) => `${category}: ${total}`).join(', ');
}

function describeAverages(averages: ReadonlyMap<string, number>): string {
  if (averages.size === 0) return 'nenhuma';
  return [...averages]
    .map(([category, value]) => `${category}: ${value.toFixed(1)}`)
    .join(', ');
}

export type InsightsPromptParams = {
  readonly children: readonly ChildContext[];
  readonly category: string | undefined;
};

export function buildInsightsPrompt({ children, category }: InsightsPromptParams): string {
  const quantity =
    category === undefined
      ? `Gere exatamente ${INSIGHTS_PER_CATEGORY} insight para CADA uma destas categorias: ${INSIGHT_CATEGORIES.join(', ')}.`
      : `Gere exatamente ${INSIGHTS_FOR_SINGLE_CATEGORY} insights para a categoria: ${category}.`;

  return [
    'Gere insights de paternidade para este pai.',
    '',
    'Filhos:',
    describeChildren(children),
    '',
    quantity,
    '',
    'Cada insight precisa ser prático, aplicável esta semana e adequado à idade.',
    'Em `childName`, escreva o nome do filho a que o insight se refere, ou deixe',
    'vazio quando ele valer para todos.',
    '',
    WRITING_RULES,
  ].join('\n');
}

export type SuggestionsPromptParams = {
  readonly children: readonly ChildContext[];
  readonly month: string;
};

export function buildSuggestionsPrompt({ children, month }: SuggestionsPromptParams): string {
  const { monthNumber } = parseMonth(month);
  const monthIndex = monthNumber - 1;

  return [
    `Sugira ${ACTIVITY_SUGGESTION_COUNT} atividades para o pai fazer com os filhos.`,
    '',
    'Filhos:',
    describeChildren(children),
    '',
    `Mês: ${MONTH_NAMES[monthIndex] ?? month}. Estação: ${SEASONS_BY_MONTH[monthIndex] ?? 'indefinida'}.`,
    `Use apenas estas categorias: ${ACTIVITY_CATEGORIES.join(', ')}.`,
    '',
    'Leve a estação em conta: atividade ao ar livre no inverno precisa ser viável.',
    'Em `childName`, escreva o nome do filho, ou deixe vazio para atividade em família.',
    '',
    WRITING_RULES,
  ].join('\n');
}

export type ReportPromptParams = {
  readonly children: readonly ChildContext[];
  readonly month: string;
  readonly activities: ActivitySummary;
  readonly insights: InsightSummary;
};

export function buildReportPrompt({
  children,
  month,
  activities,
  insights,
}: ReportPromptParams): string {
  const { monthNumber } = parseMonth(month);

  return [
    `Monte o boletim de paternidade de ${MONTH_NAMES[monthNumber - 1] ?? month}.`,
    '',
    'Filhos:',
    describeChildren(children),
    '',
    'Números do mês (medidos pelo sistema, não estime outros):',
    `- atividades planejadas: ${activities.total}`,
    `- atividades concluídas: ${activities.completed}`,
    `- taxa de conclusão: ${activities.completionRate.toFixed(0)}%`,
    `- nota média das atividades: ${activities.averageRating?.toFixed(1) ?? 'sem nota'}`,
    `- atividades por categoria: ${describeCounts(activities.countByCategory)}`,
    `- insights avaliados: ${insights.ratedCount}`,
    `- nota média dos insights: ${insights.averageRating?.toFixed(1) ?? 'sem nota'}`,
    `- média por categoria de insight: ${describeAverages(insights.averageByCategory)}`,
    '',
    `Dê uma nota de ${REPORT_GRADE_MIN} a ${REPORT_GRADE_MAX} coerente com esses números,`,
    `${REPORT_HIGHLIGHT_COUNT} pontos fortes, ${REPORT_HIGHLIGHT_COUNT} pontos de melhoria,`,
    'uma mensagem motivacional curta e uma meta para o mês seguinte.',
    'Cada ponto: título curto e no máximo 2 frases.',
    '',
    WRITING_RULES,
  ].join('\n');
}

export type ChatPromptParams = {
  readonly children: readonly ChildContext[];
  readonly message: string;
  /** Quantas fotos o pai mandou junto desta pergunta. */
  readonly imageCount?: number;
};

const PHOTO_ONLY_QUESTION = 'O pai mandou só a foto, sem texto. Comente o que ela mostra e como ajudar.';

/**
 * A conversa anterior viaja como falas proprias, antes desta; aqui vai so o
 * contexto que muda (os filhos) e a pergunta atual.
 */
export function buildChatPrompt({ children, message, imageCount = 0 }: ChatPromptParams): string {
  const lines = ['Filhos deste pai:', describeChildren(children), ''];
  if (imageCount > 0) {
    lines.push(
      imageCount === 1
        ? 'O pai enviou uma foto junto desta pergunta.'
        : `O pai enviou ${imageCount} fotos junto desta pergunta.`,
      '',
    );
  }
  lines.push(CHAT_STYLE_RULES, '');
  lines.push(`Pergunta do pai: ${message.length > 0 ? message : PHOTO_ONLY_QUESTION}`);
  return lines.join('\n');
}
