/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/**
 * "Este pai consentiu, para este filho, com esta finalidade?" — a pergunta do
 * art. 14 §1 da LGPD, que exige consentimento ESPECIFICO e em destaque de um
 * dos pais para tratar dado de crianca.
 *
 * Mora em `shared/` pelo mesmo motivo de `child-ownership.interface.ts`: tem
 * DOIS donos. Quem ESCREVE o consentimento e' `ChildConsent`; quem o LE, antes
 * de aceitar o primeiro exame, e' `ChildFile`. Fazer o segundo importar o
 * primeiro amarraria o modulo de arquivo ao de consentimento, e a pergunta
 * ainda vai ganhar um terceiro leitor (a tela, em `H5.3`).
 *
 * So' `hasConsent` porque este e' o lado do LEITOR: conceder e revogar sao
 * escritas, e ficam no caso de uso que tambem carimba a trilha.
 */
export type ChildConsentPort = {
  hasConsent(params: {
    readonly childId: string;
    readonly userId: string;
    readonly purpose: string;
  }): Promise<boolean>;
};
