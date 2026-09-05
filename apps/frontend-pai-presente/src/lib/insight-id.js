/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/**
 * O insight nasce da IA e nao tem linha no banco: o id que a tela inventa E a
 * chave da nota (`PUT /v1/insight-ratings/:insightId`), e a API guarda uma nota
 * por par usuario+insight.
 *
 * Enquanto esse id vinha de `Date.now()`, ele mudava a cada geracao: a nota que
 * o pai deu ontem nunca casava com o insight de hoje, entao a estrela voltava
 * apagada e cada clique gravava uma linha nova. A identidade tem de sair do
 * CONTEUDO — mesmo conselho, mesmo id, em qualquer visita.
 */

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;
const RADIX = 36;
const IDENTIFIER_PREFIX = 'insight_';

/** Separador que nao aparece em texto: junta os campos sem poder confundi-los. */
const FIELD_SEPARATOR = '\u001f';

/** Teto da coluna `insight_id` na API; o id tambem viaja no caminho da rota. */
export const INSIGHT_ID_MAX_LENGTH = 255;

function toHash(text) {
  let hash = FNV_OFFSET_BASIS;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return (hash >>> 0).toString(RADIX);
}

/**
 * `child_name` e nao `childName`: aqui chega o insight ja convertido por
 * `toPagePayload`, na forma que o resto das telas le.
 */
export function toInsightId({ category, title, child_name: childName }) {
  const content = [category ?? '', childName ?? '', title ?? ''].join(FIELD_SEPARATOR);
  return `${IDENTIFIER_PREFIX}${toHash(content)}_${content.length.toString(RADIX)}`;
}

/**
 * Insight repetido no mesmo lote sai uma vez so: dois cartoes com o mesmo id
 * dariam a mesma chave de React e mostrariam a nota de um no outro.
 */
export function withStableIds(insights) {
  const seen = new Set();

  return insights.flatMap((insight) => {
    const id = toInsightId(insight);
    if (seen.has(id)) return [];
    seen.add(id);
    return [{ ...insight, id }];
  });
}
