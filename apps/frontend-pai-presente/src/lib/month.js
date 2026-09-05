/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { format } from 'date-fns';

/**
 * `YYYY-MM` e o formato que a API exige nas rotas de IA, e ele aparecia em duas
 * telas. Uma so funcao para que o dia 31 nunca vire "mes que vem" por fuso: o
 * `format` do date-fns le a data no relogio local, que e o mes que o pai ve.
 */
const MONTH_KEY_FORMAT = 'yyyy-MM';

export function toMonthKey(date) {
  return format(date, MONTH_KEY_FORMAT);
}
