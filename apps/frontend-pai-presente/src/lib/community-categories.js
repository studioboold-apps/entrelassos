/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/**
 * As quatro categorias de post viviam em duas copias, uma no cartao e outra no
 * formulario, com o rotulo em portugues cravado nas duas (`docs/DEBITO.md`).
 * Mesmo desenho de `activity-categories.js`: a identidade que o servidor grava
 * e' o `id`, o rotulo vive em `locales/community.locale*.json`.
 */
export const COMMUNITY_CATEGORIES = Object.freeze([
  { id: 'experiencia', labelKey: 'community.categories.experiencia', color: 'text-blue-600 bg-blue-400/10' },
  { id: 'dica', labelKey: 'community.categories.dica', color: 'text-emerald-600 bg-emerald-400/10' },
  { id: 'duvida', labelKey: 'community.categories.duvida', color: 'text-yellow-400 bg-yellow-400/10' },
  { id: 'conquista', labelKey: 'community.categories.conquista', color: 'text-purple-400 bg-purple-400/10' },
]);

export const DEFAULT_COMMUNITY_CATEGORY = COMMUNITY_CATEGORIES[0];

/** Categoria que o servidor nao conhece cai na primeira, como antes. */
export function findCommunityCategory(id) {
  return COMMUNITY_CATEGORIES.find((category) => category.id === id) ?? DEFAULT_COMMUNITY_CATEGORY;
}
