/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';
import { format, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** A ordem e' a de `Date.getDay()`: domingo e' zero. */
const WEEK_DAY_KEYS = Object.freeze([
  'juntinhos.weekDays.sunday',
  'juntinhos.weekDays.monday',
  'juntinhos.weekDays.tuesday',
  'juntinhos.weekDays.wednesday',
  'juntinhos.weekDays.thursday',
  'juntinhos.weekDays.friday',
  'juntinhos.weekDays.saturday',
]);

const DAY_STYLE = {
  selected: 'bg-gradient-to-r from-blue-500 to-amber-500 text-white',
  today: 'bg-zinc-800 text-blue-600',
  idle: 'hover:bg-zinc-800 text-zinc-400',
};

/**
 * Fatia da tela de Juntinhos: recebe o retorno do hook, nao props soltas.
 *
 * @param {{ juntinhos: ReturnType<import('@/pages/Juntinhos.hook').useJuntinhos> }} props
 */
export default function JuntinhosCalendar({ juntinhos }) {
  const { t } = useTranslation();
  const {
    monthLabel,
    days,
    daysWithActivities,
    firstDayOfMonth,
    selectedDate,
    handlePreviousMonth,
    handleNextMonth,
    handleSelectDate,
  } = juntinhos;

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePreviousMonth}
          aria-label={t('juntinhos.previousMonth')}
          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <ChevronLeft aria-hidden="true" className="w-5 h-5 text-zinc-400" />
        </button>
        <h2 className="font-medium text-zinc-100 capitalize">{monthLabel}</h2>
        <button
          onClick={handleNextMonth}
          aria-label={t('juntinhos.nextMonth')}
          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <ChevronRight aria-hidden="true" className="w-5 h-5 text-zinc-400" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEK_DAY_KEYS.map((key) => (
          <div key={key} className="text-center text-xs text-zinc-600 py-2">
            {t(key)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array(firstDayOfMonth)
          .fill(null)
          .map((_, index) => (
            <div key={`empty-${index}`} />
          ))}
        {days.map((day) => {
          const hasActivity = daysWithActivities.some((marked) => isSameDay(marked, day));
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleSelectDate(day)}
              className={cn(
                'relative aspect-square rounded-xl text-sm font-medium transition-all',
                isSelected ? DAY_STYLE.selected : isToday ? DAY_STYLE.today : DAY_STYLE.idle,
              )}
            >
              {format(day, 'd')}
              {hasActivity && !isSelected && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
