/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/**
 * Atividade e aniversario sao DIA DE CALENDARIO: nao tem hora nem fuso. Mas
 * `new Date('2026-09-10')` e lido como meia-noite UTC pela especificacao da
 * linguagem, e a oeste de Greenwich isso e o dia anterior — a atividade do dia
 * 10 aparecia sob o dia 9, e o ponto do calendario ia junto.
 *
 * Consertar so a API nao resolveria: mesmo recebendo `'2026-09-10'`, o
 * `new Date` do navegador continua jogando o dia para tras. As duas metades
 * sao necessarias.
 */

const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;
const MONTH_INDEX_OFFSET = 1;
const PADDED_LENGTH = 2;
const PAD_CHARACTER = '0';

/**
 * @param {string | null | undefined} value dia `YYYY-MM-DD`, ou o instante que
 *   a API publicava antes de a coluna virar dia de calendario.
 * @returns {Date | undefined} meia-noite no fuso de quem esta olhando.
 */
export function toLocalDate(value) {
  if (typeof value !== 'string') return undefined;

  const matched = CALENDAR_DATE_PATTERN.exec(value);
  if (matched === null) return undefined;

  return new Date(Number(matched[1]), Number(matched[2]) - MONTH_INDEX_OFFSET, Number(matched[3]));
}

/**
 * @param {Date | undefined} date
 * @returns {string | undefined} `YYYY-MM-DD` pelos getters LOCAIS — o dia que a
 *   pessoa ve no relogio dela, nunca o dia em Greenwich.
 */
export function toCalendarDate(date) {
  if (date === undefined) return undefined;

  const year = date.getFullYear();
  const month = String(date.getMonth() + MONTH_INDEX_OFFSET).padStart(PADDED_LENGTH, PAD_CHARACTER);
  const day = String(date.getDate()).padStart(PADDED_LENGTH, PAD_CHARACTER);
  return `${year}-${month}-${day}`;
}
