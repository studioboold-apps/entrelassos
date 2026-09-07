/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

export const TIMELINE_ENTRY_KINDS = Object.freeze({ ACTIVITY: 'activity', FILE: 'file' });

const CALENDAR_DATE_LENGTH = 10;
const NO_DAY = '';

/**
 * O instante que a API publica vem como `2026-09-07T13:40:00.000Z`; o dia de
 * calendario, como `2026-09-07`. Cortar nos dez primeiros caracteres iguala os
 * dois SEM passar por `new Date`, que a oeste de Greenwich puxaria o dia para
 * tras (ver `calendar-date.js`).
 *
 * @param {unknown} value
 * @returns {string} `YYYY-MM-DD`, ou vazio quando nao ha dia nenhum.
 */
function toDay(value) {
  if (typeof value !== 'string') return NO_DAY;
  return value.slice(0, CALENDAR_DATE_LENGTH);
}

/**
 * Mesma conta do `CHILD_FILE_TIMELINE_ORDER` do repositorio da API —
 * `coalesce(taken_on, created_at::date)`. As duas metades ordenam pela MESMA
 * regra de proposito: se a tela escolhesse outra, a pagina 2 chegaria fora da
 * ordem da pagina 1 e ninguem veria motivo.
 *
 * @param {{taken_on?: string | null, created_date?: string | null}} file
 * @returns {string}
 */
export function childFileDay(file) {
  const takenOn = toDay(file.taken_on);
  return takenOn === NO_DAY ? toDay(file.created_date) : takenOn;
}

/**
 * @param {{date?: string | null, created_date?: string | null}} activity
 * @returns {string}
 */
export function activityDay(activity) {
  const activityDate = toDay(activity.date);
  return activityDate === NO_DAY ? toDay(activity.created_date) : activityDate;
}

/**
 * Ordem total, e nao so' por dia: dia, depois o instante de gravacao, depois a
 * chave. Sem o ultimo criterio dois registros do mesmo dia trocariam de lugar
 * entre duas renderizacoes, e a linha do tempo pularia debaixo do dedo.
 */
function compareEntries(first, second) {
  if (first.day !== second.day) return first.day < second.day ? 1 : -1;
  if (first.createdDate !== second.createdDate) return first.createdDate < second.createdDate ? 1 : -1;
  return first.key < second.key ? -1 : 1;
}

/**
 * @param {{activities?: readonly object[], files?: readonly object[], childId?: string}} params
 * @returns {readonly {key: string, entryKind: string, day: string, createdDate: string, item: object}[]}
 */
export function buildChildTimeline({ activities = [], files = [], childId } = {}) {
  /** A lista de arquivos ja vem por filho na propria rota; a de atividades e' da conta inteira. */
  const fileEntries = files.map((file) => ({
    key: `${TIMELINE_ENTRY_KINDS.FILE}:${file.id}`,
    entryKind: TIMELINE_ENTRY_KINDS.FILE,
    day: childFileDay(file),
    createdDate: toDay(file.created_date) === NO_DAY ? NO_DAY : file.created_date,
    item: file,
  }));

  const activityEntries = activities
    .filter((activity) => activity.child_id === childId)
    .map((activity) => ({
      key: `${TIMELINE_ENTRY_KINDS.ACTIVITY}:${activity.id}`,
      entryKind: TIMELINE_ENTRY_KINDS.ACTIVITY,
      day: activityDay(activity),
      createdDate: toDay(activity.created_date) === NO_DAY ? NO_DAY : activity.created_date,
      item: activity,
    }));

  return [...fileEntries, ...activityEntries].sort(compareEntries);
}
