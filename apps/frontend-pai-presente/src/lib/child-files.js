/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { FileText, ImagePlus } from 'lucide-react';

export const CHILD_FILE_KINDS = Object.freeze({ PHOTO: 'foto', EXAM: 'exame' });

/**
 * Mesmo desenho de `activity-categories.js`: o `kind` e' o que a API grava, e o
 * rotulo e' texto de usuario, que vive em `*.locale.json` e chega aqui como
 * CHAVE literal — chave montada em tempo de execucao nao e' verificada por
 * ninguem.
 *
 * A tabela e' unica porque tanto o formulario de envio quanto a linha do tempo
 * nomeiam o tipo: duas copias concordam ate a primeira edicao.
 */
export const CHILD_FILE_KIND_OPTIONS = Object.freeze([
  { kind: CHILD_FILE_KINDS.PHOTO, icon: ImagePlus, labelKey: 'perfil.childFiles.kinds.photo' },
  { kind: CHILD_FILE_KINDS.EXAM, icon: FileText, labelKey: 'perfil.childFiles.kinds.exam' },
]);

/**
 * @param {string} kind
 * @returns {{kind: string, icon: unknown, labelKey: string} | undefined}
 */
export function findChildFileKind(kind) {
  return CHILD_FILE_KIND_OPTIONS.find((option) => option.kind === kind);
}

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
/**
 * `GB` esta' aqui porque o teto da CONTA e' de 2 GiB: sem a unidade, a barra de
 * uso imprimiria "2048.0 MB" — numero certo, frase que ninguem le'.
 */
const SIZE_UNITS = Object.freeze(['B', 'kB', 'MB', 'GB']);
const SIZE_DECIMALS = 1;

/**
 * `byteSize` chega em bytes crus, e "3512904" nao diz nada a quem so' quer saber
 * se a foto e' grande. O teto por arquivo fala na mesma unidade.
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

/**
 * Motivos de recusa ANTES de o arquivo subir. A API decide de verdade — estes
 * tres tetos sao os mesmos numeros que ela cobra —, e a tela repete a conta so'
 * para nao fazer o pai esperar o envio de um arquivo que nunca ia caber.
 *
 * A cota vem do servidor (`ChildFile.usage`), e nao duplicada aqui: um numero
 * copiado concorda com o da API ate' a primeira edicao.
 */
export const CHILD_FILE_FIT = Object.freeze({
  OK: 'ok',
  FILE_TOO_LARGE: 'fileTooLarge',
  CHILD_QUOTA: 'childQuota',
  ACCOUNT_QUOTA: 'accountQuota',
});

/**
 * @param {{file: File | null, usage: {fileMaxBytes: number, child: {remainingBytes: number}, account: {remainingBytes: number}} | undefined}} params
 * @returns {string}
 */
export function checkChildFileFit({ file, usage }) {
  if (file === null || usage === undefined) return CHILD_FILE_FIT.OK;
  if (file.size > usage.fileMaxBytes) return CHILD_FILE_FIT.FILE_TOO_LARGE;
  if (file.size > usage.child.remainingBytes) return CHILD_FILE_FIT.CHILD_QUOTA;
  if (file.size > usage.account.remainingBytes) return CHILD_FILE_FIT.ACCOUNT_QUOTA;
  return CHILD_FILE_FIT.OK;
}
