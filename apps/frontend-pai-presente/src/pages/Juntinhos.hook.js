/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addMonths, eachDayOfInterval, endOfMonth, format, isSameDay, startOfMonth, subMonths } from 'date-fns';

import { api } from '@/api/client';
import { describeApiFailure } from '@/lib/api-error-message';
import { buildActivityPayload, createEmptyActivityForm } from '@/lib/activity-form';
import { toCalendarDate, toLocalDate } from '@/lib/calendar-date';
import { useTranslation } from '@/lib/i18n';
import { toMonthKey } from '@/lib/month';

/**
 * A decisao do calendario mora aqui (`web.md` §4): o mes, o dia escolhido, as
 * tres escritas e o formulario sao regra, e regra fora do JSX pode ser lida sem
 * montar tela.
 */
export function useJuntinhos() {
  const { t, dateLocale } = useTranslation();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNewActivity, setShowNewActivity] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newActivity, setNewActivity] = useState(() => createEmptyActivityForm(new Date()));

  const { data: children = [] } = useQuery({
    queryKey: ['children'],
    queryFn: () => api.entities.Child.list(),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => api.entities.Activity.list(),
  });

  const createActivityMutation = useMutation({
    mutationFn: (data) => api.entities.Activity.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setShowNewActivity(false);
      setShowSuggestions(false);
      setNewActivity(createEmptyActivityForm(selectedDate));
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Activity.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  /**
   * A sugestao vem da IA: e dado de servidor, e dado de servidor nao mora em
   * `useState` (`web.md` §5). Enquanto morava, a falha ia so para o console do
   * navegador e o botao simplesmente voltava de "Sugerir" — sem chave de IA a
   * API responde 503 com o motivo escrito, e ninguem lia.
   */
  const suggestionsMutation = useMutation({
    /**
     * A estacao do ano, a idade dos filhos e o mes montavam o prompt aqui
     * dentro. Quem conhece os filhos e a API; a tela so diz de que mes quer
     * sugestao.
     *
     * @param {string} month
     */
    mutationFn: (month) => api.ai.activitySuggestions(month),
    onSuccess: () => {
      setShowSuggestions(true);
    },
  });

  const suggestions = suggestionsMutation.data ?? [];
  const suggestionsFailure = suggestionsMutation.isError ? describeApiFailure(suggestionsMutation.error) : null;
  const createFailure = createActivityMutation.isError ? describeApiFailure(createActivityMutation.error) : null;
  const updateFailure = updateActivityMutation.isError ? describeApiFailure(updateActivityMutation.error) : null;

  /** Fora dos dialogos so cabe um aviso; o mais recente e o que a pessoa acabou de provocar. */
  const screenFailure = suggestionsFailure ?? updateFailure ?? createFailure;

  const handleCreateActivity = () => {
    createActivityMutation.mutate({ ...buildActivityPayload(newActivity), is_suggested: false });
  };

  /** So o campo que muda: devolver a atividade inteira reenvia `id` e `child_name`, que a API nao aceita escrever. */
  const handleComplete = (activity) => {
    updateActivityMutation.mutate({ id: activity.id, data: { completed: true } });
  };

  const handleRate = (activityId, rating) => {
    updateActivityMutation.mutate({ id: activityId, data: { rating } });
  };

  const handleGenerateSuggestions = () => {
    if (children.length === 0) return;
    suggestionsMutation.mutate(toMonthKey(currentMonth));
  };

  /** O dialogo so fecha quando a gravacao volta: fechar antes esconderia a recusa. */
  const handleAcceptSuggestion = (suggestion) => {
    /** A atividade se vincula por id; o nome que a IA devolveu so serve para achar o filho. */
    const child = children.find((candidate) => candidate.name === suggestion.child_name) ?? children[0];
    createActivityMutation.mutate({
      title: suggestion.title,
      description: suggestion.description,
      category: suggestion.category,
      date: toCalendarDate(selectedDate),
      ...(child ? { child_id: child.id } : {}),
      is_suggested: true,
    });
  };

  const handleOpenNewActivity = () => {
    /** Sem isto o dialogo reabre com o aviso da tentativa anterior, que ja passou. */
    createActivityMutation.reset();
    setNewActivity((previous) => ({ ...previous, date: toCalendarDate(selectedDate) }));
    setShowNewActivity(true);
  };

  const handleActivityFieldChange = (field, value) => {
    setNewActivity((previous) => ({ ...previous, [field]: value }));
  };

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });

  /**
   * `new Date('2026-09-10')` e meia-noite em Greenwich, nao aqui: a oeste dela o
   * dia recua um, e a atividade do dia 10 aparecia sob o dia 9 — com o pontinho
   * do calendario junto. `toLocalDate` le o dia como DIA.
   */
  const activitiesForSelectedDate = activities.filter((activity) => isSameDay(toLocalDate(activity.date), selectedDate));
  const daysWithActivities = activities.map((activity) => toLocalDate(activity.date));

  return {
    currentMonth,
    selectedDate,
    monthLabel: format(currentMonth, t('common.dateFormats.monthYear'), { locale: dateLocale }),
    selectedDateLabel: format(selectedDate, t('common.dateFormats.dayMonthLong'), { locale: dateLocale }),
    days,
    daysWithActivities,
    activitiesForSelectedDate,
    firstDayOfMonth: startOfMonth(currentMonth).getDay(),
    children,
    suggestions,
    newActivity,
    showNewActivity,
    showSuggestions,
    screenFailure,
    createFailure,
    isGeneratingSuggestions: suggestionsMutation.isPending,
    isCreating: createActivityMutation.isPending,
    canSuggest: children.length > 0,
    canCreate: Boolean(newActivity.title),
    setShowNewActivity,
    setShowSuggestions,
    handlePreviousMonth: () => setCurrentMonth(subMonths(currentMonth, 1)),
    handleNextMonth: () => setCurrentMonth(addMonths(currentMonth, 1)),
    handleSelectDate: setSelectedDate,
    handleCreateActivity,
    handleComplete,
    handleRate,
    handleGenerateSuggestions,
    handleAcceptSuggestion,
    handleOpenNewActivity,
    handleActivityFieldChange,
  };
}
