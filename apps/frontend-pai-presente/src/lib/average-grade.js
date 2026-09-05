/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/**
 * Media com uma casa, ou NADA quando ninguem avaliou.
 *
 * Devolver zero seria dizer que a nota foi a pior possivel. Ninguem tirou nota
 * nenhuma — sao coisas diferentes, e a tela precisa poder mostrar cada uma.
 *
 * Mora aqui, e nao dentro do boletim, porque o perfil faz a mesma conta: duas
 * copias de uma regra concordam ate a primeira edicao, e a do perfil ja tinha
 * divergido para o zero.
 *
 * @param {readonly number[]} grades
 * @returns {string | undefined}
 */
export function toAverageGrade(grades) {
  if (grades.length === 0) return undefined;

  const total = grades.reduce((sum, grade) => sum + grade, 0);

  return (total / grades.length).toFixed(1);
}
