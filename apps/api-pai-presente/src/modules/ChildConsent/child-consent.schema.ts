/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { z } from 'zod';

import { CHILD_CONSENT_PURPOSE_VALUES } from './child-consent.constant';

/**
 * A finalidade vem de uma LISTA fechada, no corpo e no caminho. Aceitar texto
 * livre criaria consentimento para finalidade que o produto nao trata — e o
 * registro passaria a dizer menos que nada, porque teria a forma de uma prova
 * sem ser prova de coisa alguma.
 */
export const childConsentPurposeSchema = z.enum(
  CHILD_CONSENT_PURPOSE_VALUES as [string, ...string[]],
);

export const grantChildConsentBodySchema = z.object({ purpose: childConsentPurposeSchema });
