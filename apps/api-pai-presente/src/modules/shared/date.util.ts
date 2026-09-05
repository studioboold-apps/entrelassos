/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/** Meses por extenso, em portugues, indexados por `getMonth()`. */
export const MONTH_NAMES = [
  'janeiro',
  'fevereiro',
  'marco',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const;

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

export type MonthRange = {
  readonly firstDay: string;
  readonly lastDay: string;
};

export type MonthParts = {
  readonly year: number;
  /** 1 a 12, como a pessoa le — nao o indice de `Date`. */
  readonly monthNumber: number;
};

export function parseMonth(month: string): MonthParts {
  const matched = MONTH_PATTERN.exec(month);
  if (matched === null) throw new Error(`mes fora do formato YYYY-MM: ${month}`);
  return { year: Number(matched[1]), monthNumber: Number(matched[2]) };
}

/**
 * O ultimo dia sai do calendario, nunca de um `-31` fixo: fevereiro faria o
 * Postgres recusar a data inteira, e a recusa apareceria so em fevereiro.
 */
export function buildMonthRange(month: string): MonthRange {
  const { year, monthNumber } = parseMonth(month);
  const lastDayNumber = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return {
    firstDay: `${month}-01`,
    lastDay: `${month}-${String(lastDayNumber).padStart(2, '0')}`,
  };
}

export function formatMonth(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export type MonthInstantRange = { readonly start: Date; readonly endExclusive: Date };

/**
 * Para coluna de INSTANTE, a faixa e meio-aberta em UTC: `< primeiro dia do mes
 * seguinte` nao depende de quantos dias o mes tem nem de quantos milissegundos
 * cabem no ultimo segundo.
 */
export function buildMonthInstantRange(month: string): MonthInstantRange {
  const { year, monthNumber } = parseMonth(month);
  return {
    start: new Date(Date.UTC(year, monthNumber - 1, 1)),
    endExclusive: new Date(Date.UTC(year, monthNumber, 1)),
  };
}
