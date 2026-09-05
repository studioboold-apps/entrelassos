/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/**
 * O corpo do `PATCH /v1/me`, montado a partir do que esta no formulario.
 *
 * Duas coisas que a tela errava, e as duas so apareciam como recusa da API:
 *
 * 1. Campo em branco viajava como numero invalido, e a requisicao INTEIRA caia
 *    em 400 — o pai perdia junto o que tinha preenchido certo. Campo vazio nao
 *    e um valor: e a ausencia de pedido, e ausencia se omite.
 * 2. A tela mandava tambem os campos que a nossa base nao tem, e o schema da
 *    API e estrito: um campo desconhecido reprova o resto.
 *
 * @param {{ age?: string, marital_status?: string }} form
 * @returns {{ age?: number, marital_status?: string }}
 */
export function toProfileUpdate({ age = '', marital_status: maritalStatus = '' }) {
  const update = {};
  const parsedAge = Number.parseInt(age, 10);

  if (Number.isInteger(parsedAge)) update.age = parsedAge;
  if (maritalStatus !== '') update.marital_status = maritalStatus;

  return update;
}
