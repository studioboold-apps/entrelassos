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
export const MENTOR_SYSTEM_PROMPT =
  'Voce e um mentor de paternidade do Entrelaços — Pai Presente: especialista em desenvolvimento ' +
  'infantil, acolhedor e pratico. Responda sempre em portugues do Brasil, sem ' +
  'julgar o pai, com conselhos aplicaveis no dia a dia e adequados a idade de cada ' +
  'filho. Nunca invente diagnostico nem substitui profissional de saude. ' +
  'Use o que ja foi dito na conversa: nao peca de novo o que o pai ja contou.';

const NO_CHILDREN_LINE = 'O pai ainda nao cadastrou filhos.';

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
    'Cada insight precisa ser pratico, aplicavel esta semana e adequado a idade.',
    'Em `childName`, escreva o nome do filho a que o insight se refere, ou deixe',
    'vazio quando ele valer para todos.',
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
    `Mes: ${MONTH_NAMES[monthIndex] ?? month}. Estacao: ${SEASONS_BY_MONTH[monthIndex] ?? 'indefinida'}.`,
    `Use apenas estas categorias: ${ACTIVITY_CATEGORIES.join(', ')}.`,
    '',
    'Leve a estacao em conta: atividade ao ar livre no inverno precisa ser viavel.',
    'Em `childName`, escreva o nome do filho, ou deixe vazio para atividade em familia.',
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
    'Numeros do mes (medidos pelo sistema, nao estime outros):',
    `- atividades planejadas: ${activities.total}`,
    `- atividades concluidas: ${activities.completed}`,
    `- taxa de conclusao: ${activities.completionRate.toFixed(0)}%`,
    `- nota media das atividades: ${activities.averageRating?.toFixed(1) ?? 'sem nota'}`,
    `- atividades por categoria: ${describeCounts(activities.countByCategory)}`,
    `- insights avaliados: ${insights.ratedCount}`,
    `- nota media dos insights: ${insights.averageRating?.toFixed(1) ?? 'sem nota'}`,
    `- media por categoria de insight: ${describeAverages(insights.averageByCategory)}`,
    '',
    `Dê uma nota de ${REPORT_GRADE_MIN} a ${REPORT_GRADE_MAX} coerente com esses numeros,`,
    `${REPORT_HIGHLIGHT_COUNT} pontos fortes, ${REPORT_HIGHLIGHT_COUNT} pontos de melhoria,`,
    'uma mensagem motivacional curta e uma meta para o mes seguinte.',
  ].join('\n');
}

export type ChatPromptParams = {
  readonly children: readonly ChildContext[];
  readonly message: string;
  /** Quantas fotos o pai mandou junto desta pergunta. */
  readonly imageCount?: number;
};

const PHOTO_ONLY_QUESTION = 'O pai mandou so a foto, sem texto. Comente o que ela mostra e como ajudar.';

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
  lines.push(`Pergunta do pai: ${message.length > 0 ? message : PHOTO_ONLY_QUESTION}`);
  return lines.join('\n');
}
