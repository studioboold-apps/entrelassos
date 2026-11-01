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
 * Cidade e foto so' viajam quando o formulario as conhece (`undefined` = a tela
 * nao mexeu nelas). Cidade apagada vira `null`, que e' o pedido de apagar.
 *
 * @param {{ age?: string, marital_status?: string, city?: string, avatar_url?: string | null }} form
 * @returns {{ age?: number, marital_status?: string, city?: string | null, avatar_url?: string | null }}
 */
export function toProfileUpdate({ age = '', marital_status: maritalStatus = '', city, avatar_url: avatarUrl }) {
  const update = {};
  const parsedAge = Number.parseInt(age, 10);

  if (Number.isInteger(parsedAge)) update.age = parsedAge;
  if (maritalStatus !== '') update.marital_status = maritalStatus;
  if (city !== undefined) update.city = city.trim() === '' ? null : city.trim();
  if (avatarUrl !== undefined) update.avatar_url = avatarUrl;

  return update;
}
