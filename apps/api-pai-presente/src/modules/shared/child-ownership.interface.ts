/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/**
 * "Este filho e' deste pai?" — a pergunta que impede BOLA (OWASP API1) em todo
 * modulo que aceita um `childId` de fora.
 *
 * Mora em `shared/` porque tem DOIS donos: a atividade, que recebe o id no
 * corpo, e o arquivo do filho, que recebe no caminho. Deixa-la dentro de
 * `Activity/` faria o segundo modulo importar do primeiro, e regra com duas
 * casas concorda so' ate a primeira edicao (`code-standart.md` §16).
 */
export type ChildOwnershipPort = {
  isOwnedByUser(params: { readonly childId: string; readonly userId: string }): Promise<boolean>;
};
