/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { AUTH_PROVIDERS, OIDC_PROVIDER_CONFIG, type AuthProvider } from '../auth.constant';
import type { IdentityVerifier, IdentityVerifierRegistry } from '../types/auth.types';
import { createOidcVerifier } from './oidc.verifier';

export type ProviderClientIds = Readonly<Partial<Record<AuthProvider, string>>>;

/**
 * Fail-closed (security.md §2): sem NENHUM provedor configurado a API nao sobe.
 * A alternativa tentadora — um usuario falso de desenvolvimento — e exatamente
 * o atalho que vira porta aberta quando alguem publica com o env incompleto.
 */
export function createIdentityVerifierRegistry(
  clientIds: ProviderClientIds,
): IdentityVerifierRegistry {
  const verifiers = new Map<AuthProvider, IdentityVerifier>();

  for (const provider of AUTH_PROVIDERS) {
    const clientId = clientIds[provider];
    if (clientId === undefined || clientId.length === 0) continue;
    const config = OIDC_PROVIDER_CONFIG[provider];
    verifiers.set(provider, createOidcVerifier({ ...config, clientId }));
  }

  if (verifiers.size === 0) {
    throw new Error(
      'nenhum provedor de login configurado: defina GOOGLE_CLIENT_ID ou APPLE_CLIENT_ID',
    );
  }

  return {
    forProvider(provider: AuthProvider): IdentityVerifier | undefined {
      return verifiers.get(provider);
    },
  };
}
