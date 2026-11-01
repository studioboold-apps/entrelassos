/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/**
 * Chave de comparacao: "Católica", "catolica" e "  CATÓLICA " sao a mesma
 * resposta. Sem isto a lista de sugestoes se enche de duplicatas que so'
 * diferem em acento ou maiuscula.
 */
export function normalizeFamilyValueKey(label: string): string {
  return label
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** Como o rotulo novo e' guardado: sem espacos sobrando e com a primeira letra maiuscula. */
export function tidyFamilyValueLabel(label: string): string {
  const collapsed = label.replace(/\s+/g, ' ').trim();
  return collapsed.charAt(0).toLocaleUpperCase('pt-BR') + collapsed.slice(1);
}
