/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/**
 * Os tres campos sensiveis que `TL.1` tinha removido voltam, a pedido do dono
 * do produto, como OPCIONAIS e com consentimento especifico (LGPD art. 11, I):
 * o pai so' grava se marcar o aceite, apaga quando quiser, e cada um alimenta
 * apenas o tom da IA.
 *
 * O valor e' texto estavel sem acento porque vai para o banco.
 */
export const FAMILY_VALUE_KINDS = {
  RELIGION: 'religiao',
  POLITICS: 'politica',
  ORIENTATION: 'orientacao',
} as const;
export type FamilyValueKind = (typeof FAMILY_VALUE_KINDS)[keyof typeof FAMILY_VALUE_KINDS];
export const FAMILY_VALUE_KIND_VALUES = Object.values(FAMILY_VALUE_KINDS);

export const FAMILY_VALUE_LABEL_MAX_LENGTH = 60;

/**
 * Uma resposta escrita so' por UM pai nao aparece na lista dos outros: texto
 * livre pode identificar alguem ("igreja do pastor fulano, rua tal"). A opcao
 * vira sugestao publica quando e' semente ou quando ao menos este numero de
 * pais a escolheu.
 */
export const FAMILY_VALUE_OPTION_MIN_USERS = 2;

export const FAMILY_VALUES_PATH = '/v1/me/family-values';
export const FAMILY_VALUE_OPTIONS_PATH = '/v1/family-values/options';
