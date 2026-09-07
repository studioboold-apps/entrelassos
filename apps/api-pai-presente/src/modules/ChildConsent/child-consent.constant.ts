/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/**
 * A finalidade e' o que o art. 14 §1 chama de ESPECIFICO: consentimento nao e'
 * um interruptor de "pode tratar dado do meu filho", e' uma resposta a uma
 * pergunta nomeada. Hoje ha uma; a coluna existir com nome desde a primeira
 * garante que a segunda nao precise de migracao destrutiva nem quebre a que ja
 * foi concedida.
 *
 * O valor e' texto estavel em portugues sem acento porque vai para o banco e
 * para o CAMINHO da rota — renomear rotulo e' barato, renomear isto invalida
 * consentimento ja registrado.
 */
export const CHILD_CONSENT_PURPOSES = {
  HEALTH_DATA: 'dado_de_saude',
} as const;
export type ChildConsentPurpose =
  (typeof CHILD_CONSENT_PURPOSES)[keyof typeof CHILD_CONSENT_PURPOSES];

export const CHILD_CONSENT_PURPOSE_VALUES = Object.values(CHILD_CONSENT_PURPOSES);

export const CHILD_CONSENTS_PATH = '/v1/children/:childId/consents';
export const CHILD_CONSENT_PATH = '/v1/children/:childId/consents/:purpose';
