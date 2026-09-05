/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { toCalendarDate } from '@/lib/calendar-date';

/** @param {Date} selectedDate */
export function createEmptyActivityForm(selectedDate) {
  return {
    title: '',
    description: '',
    date: toCalendarDate(selectedDate),
    time: '',
    child_id: '',
    category: '',
  };
}

/**
 * A API recusa o corpo inteiro quando um campo opcional chega vazio: `''` nao
 * e "sem valor", e valor invalido. O formulario nasce com tudo vazio, entao o
 * que nao foi preenchido nao vai.
 */
export function buildActivityPayload({ title, description, date, time, child_id, category }) {
  return {
    title,
    date,
    ...(description ? { description } : {}),
    ...(time ? { time } : {}),
    ...(child_id ? { child_id } : {}),
    ...(category ? { category } : {}),
  };
}
