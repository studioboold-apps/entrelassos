/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { toLocalDate } from './calendar-date';

/**
 * O mes de um DIA DE CALENDARIO. A atividade guarda `2026-09-01`, sem hora e sem
 * fuso: ela aconteceu no dia 1, e o unico jeito de errar isso e' deixar o
 * `new Date` ler a string como meia-noite em Greenwich.
 *
 * @param {string | undefined} calendarDate
 * @param {Date} monthDate
 * @returns {boolean}
 */
export function isInCalendarMonth(calendarDate, monthDate) {
  const parsed = toLocalDate(calendarDate);

  if (parsed === undefined) return false;

  return parsed.getFullYear() === monthDate.getFullYear() && parsed.getMonth() === monthDate.getMonth();
}

/**
 * O mes de um INSTANTE. Insight lido tem hora, entao o mes dele e' o mes em que o
 * relogio do pai marcava aquela hora.
 *
 * Isto DIVERGE da API por ate tres horas nas viradas de mes: la o recorte e' por
 * instante UTC (`buildMonthInstantRange`). Quem e' dono da definicao de "mes" para
 * dado com hora e' pergunta em aberto, e nao se resolve escondendo a diferenca.
 *
 * @param {string | undefined} instant
 * @param {Date} monthDate
 * @returns {boolean}
 */
function isInstantInMonth(instant, monthDate) {
  if (typeof instant !== 'string') return false;

  const parsed = new Date(instant);

  if (Number.isNaN(parsed.getTime())) return false;

  return parsed.getFullYear() === monthDate.getFullYear() && parsed.getMonth() === monthDate.getMonth();
}

/**
 * Media com uma casa, ou NADA quando ninguem avaliou.
 *
 * Devolver zero seria dizer que a nota foi a pior possivel. Ninguem tirou nota
 * nenhuma — sao coisas diferentes, e a tela precisa poder mostrar cada uma.
 *
 * @param {readonly number[]} grades
 * @returns {string | undefined}
 */
function toAverage(grades) {
  if (grades.length === 0) return undefined;

  const total = grades.reduce((sum, grade) => sum + grade, 0);

  return (total / grades.length).toFixed(1);
}

/**
 * @typedef {object} MonthStatsParams
 * @property {readonly object[]} activities
 * @property {readonly object[]} ratings
 * @property {Date} month
 */

/**
 * @param {MonthStatsParams} params
 */
export function buildMonthStats({ activities, ratings, month }) {
  const monthActivities = activities.filter((activity) => isInCalendarMonth(activity.date, month));
  const completed = monthActivities.filter((activity) => activity.completed);
  const monthRatings = ratings.filter((rating) => isInstantInMonth(rating.created_date, month));

  return {
    monthActivities,
    monthRatings,
    totalActivities: monthActivities.length,
    completedActivities: completed.length,
    completionRate:
      monthActivities.length === 0 ? 0 : Math.round((completed.length / monthActivities.length) * 100),
    avgActivityRating: toAverage(completed.filter((a) => a.rating).map((a) => a.rating)),
    totalInsightsRead: monthRatings.length,
    avgInsightRating: toAverage(monthRatings.filter((r) => r.rating).map((r) => r.rating)),
  };
}
