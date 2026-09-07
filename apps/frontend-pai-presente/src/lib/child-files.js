/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

export const CHILD_FILE_KINDS = Object.freeze({ PHOTO: 'foto', EXAM: 'exame' });

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic';

/**
 * Dica para o seletor de arquivo do sistema, NAO a regra. Quem decide o que
 * entra e' a API, que compara o tipo real dos bytes — o `accept` do navegador e'
 * so' um filtro na janela de escolha, e o pai pode trocar para "todos os
 * arquivos" com um clique.
 *
 * Por isso divergir daqui degrada para uma recusa explicada pelo
 * `describeApiFailure`, nunca para um arquivo aceito errado. Exame aceita PDF
 * **e** imagem: o caso comum nao e' o laboratorio mandando PDF, e' o pai
 * fotografando o papel com o celular.
 */
export const CHILD_FILE_ACCEPT = Object.freeze({
  [CHILD_FILE_KINDS.PHOTO]: IMAGE_ACCEPT,
  [CHILD_FILE_KINDS.EXAM]: `${IMAGE_ACCEPT},application/pdf`,
});

const BYTES_IN_KIB = 1024;
const SIZE_UNITS = Object.freeze(['B', 'kB', 'MB']);
const SIZE_DECIMALS = 1;

/**
 * `byteSize` chega em bytes crus, e "3512904" nao diz nada a quem so' quer saber
 * se a foto e' grande. O teto por arquivo (H6.1) vai falar na mesma unidade.
 */
export function formatByteSize(byteSize) {
  if (typeof byteSize !== 'number' || Number.isNaN(byteSize)) return '';

  let value = byteSize;
  let unitIndex = 0;
  while (value >= BYTES_IN_KIB && unitIndex < SIZE_UNITS.length - 1) {
    value /= BYTES_IN_KIB;
    unitIndex += 1;
  }

  const rounded = unitIndex === 0 ? String(value) : value.toFixed(SIZE_DECIMALS);
  return `${rounded} ${SIZE_UNITS[unitIndex]}`;
}
