/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format, subMonths } from 'date-fns';

import { api } from '@/api/client';
import { ACTIVITY_CATEGORIES } from '@/lib/activity-categories';
import { describeApiFailure } from '@/lib/api-error-message';
import { buildMonthStats } from '@/lib/boletim-stats';
import { useTranslation } from '@/lib/i18n';
import { INSIGHT_CATEGORIES } from '@/lib/insight-categories';
import { toMonthKey } from '@/lib/month';

const MONTH_KEY_FORMAT = 'MM/yyyy';
const RATING_FULL_MARK = 5;

function averageRating(ratings) {
  if (ratings.length === 0) return 0;
  return ratings.reduce((total, { rating }) => total + rating, 0) / ratings.length;
}

/**
 * A decisao do boletim mora aqui (`web.md` §4): o mes, as duas series de
 * grafico e a chamada da IA sao regra, e regra fora do JSX pode ser lida sem
 * montar grafico nenhum.
 */
export function useBoletim() {
  const { t, dateLocale } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => api.entities.Activity.list(),
  });

  const { data: insightRatings = [] } = useQuery({
    queryKey: ['insightRatings'],
    queryFn: () => api.entities.InsightRating.list(),
  });

  /**
   * O recorte do mes tem UMA fonte, e ela tem teste. Aqui a tela refazia a conta
   * construindo uma data a partir da string do dia, o que a le como meia-noite
   * UTC: o dia 1 de todo mes caia para o mes anterior, e a nota da IA — que a API
   * calcula por dia de calendario — falava de um conjunto de atividades diferente
   * do que os cartoes mostravam.
   */
  const stats = buildMonthStats({ activities, ratings: insightRatings, month: currentMonth });
  const { monthActivities, monthRatings } = stats;
  const completedActivities = monthActivities.filter((activity) => activity.completed);

  const insightsByCategory = INSIGHT_CATEGORIES.map(({ id, labelKey }) => ({
    category: t(labelKey),
    value: averageRating(monthRatings.filter((rating) => rating.category === id)),
    fullMark: RATING_FULL_MARK,
  }));

  const activitiesByCategory = ACTIVITY_CATEGORIES.map(({ id, labelKey }) => ({
    name: t(labelKey),
    quantidade: completedActivities.filter((activity) => activity.category === id).length,
  })).filter(({ quantidade }) => quantidade > 0);

  const reportMutation = useMutation({
    /**
     * As contas do boletim saem do SERVIDOR. Aqui elas so alimentam os graficos;
     * mandar `completionRate` pronto no prompt, como a Base44 fazia, deixava o
     * proprio cliente escolher a nota que ia receber.
     *
     * @param {string} month
     */
    mutationFn: (month) => api.ai.report(month),
  });

  /**
   * Sem chave, `POST /v1/report` responde 503 `AI_NOT_CONFIGURED`. A frase morria
   * escrita no log do navegador: o pai via o botao girar, voltar ao normal, e
   * nada acontecia — nenhuma palavra dizendo por que.
   */
  const reportFailure = reportMutation.isError ? describeApiFailure(reportMutation.error) : null;

  return {
    monthLabel: format(currentMonth, t('common.dateFormats.monthYear'), { locale: dateLocale }),
    isCurrentMonth: format(currentMonth, MONTH_KEY_FORMAT) === format(new Date(), MONTH_KEY_FORMAT),
    completedCount: completedActivities.length,
    stats,
    insightsByCategory,
    activitiesByCategory,
    hasEngagementChart: insightsByCategory.some(({ value }) => value > 0),
    report: reportMutation.data,
    isGeneratingReport: reportMutation.isPending,
    reportFailure,
    isEmptyMonth: stats.totalActivities === 0 && stats.totalInsightsRead === 0,
    handlePreviousMonth: () => setCurrentMonth(subMonths(currentMonth, 1)),
    handleCurrentMonth: () => setCurrentMonth(new Date()),
    handleGenerateReport: () => reportMutation.mutate(toMonthKey(currentMonth)),
  };
}
