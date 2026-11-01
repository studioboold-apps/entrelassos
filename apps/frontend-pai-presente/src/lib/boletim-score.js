/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/**
 * A faixa da nota decide COR e PALAVRA, e as duas escadas tinham degraus
 * diferentes dentro da tela (cor virava em 8/6/4, palavra em 9/7/5/3). Juntas
 * aqui, elas continuam diferentes de proposito — mas dá para ver isso.
 */
const COLOR_STEPS = Object.freeze([
  { min: 8, className: 'text-emerald-600' },
  { min: 6, className: 'text-blue-600' },
  { min: 4, className: 'text-yellow-400' },
]);

const LABEL_STEPS = Object.freeze([
  { min: 9, key: 'boletim.score.excellent' },
  { min: 7, key: 'boletim.score.veryGood' },
  { min: 5, key: 'boletim.score.good' },
  { min: 3, key: 'boletim.score.fair' },
]);

/** @param {number} score */
export function scoreColorClass(score) {
  return COLOR_STEPS.find(({ min }) => score >= min)?.className ?? 'text-red-600';
}

/** @param {number} score */
export function scoreLabelKey(score) {
  return LABEL_STEPS.find(({ min }) => score >= min)?.key ?? 'boletim.score.needsWork';
}
