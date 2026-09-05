/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

import { IdentityTokenInvalidError } from '../auth.error';
import type { IdentityVerifier, ProviderIdentity } from '../types/auth.types';

export type CreateOidcVerifierParams = {
  readonly issuers: readonly string[];
  readonly jwksUrl: string;
  readonly clientId: string;
};

/**
 * O `email_verified` do Google vem booleano e o da Apple vem como string:
 * comparar so com `=== true` reprova todo login Apple, calado.
 */
function isEmailVerified(payload: JWTPayload): boolean {
  const claim = payload['email_verified'];
  return claim === true || claim === 'true';
}

function readEmail(payload: JWTPayload): string | undefined {
  const claim = payload['email'];
  return typeof claim === 'string' && claim.length > 0 ? claim : undefined;
}

function readFullName(payload: JWTPayload): string | undefined {
  const claim = payload['name'];
  return typeof claim === 'string' && claim.length > 0 ? claim : undefined;
}

export function createOidcVerifier({
  issuers,
  jwksUrl,
  clientId,
}: CreateOidcVerifierParams): IdentityVerifier {
  // O conjunto de chaves e criado UMA vez: ele guarda cache e respeita o
  // cabecalho de validade do provedor. Criar por requisicao busca a cada login.
  const remoteKeySet = createRemoteJWKSet(new URL(jwksUrl));

  return {
    async verify(idToken: string): Promise<ProviderIdentity> {
      const payload = await verifyPayload(idToken);
      const email = readEmail(payload);
      if (email === undefined || !isEmailVerified(payload)) throw new IdentityTokenInvalidError();
      if (payload.sub === undefined) throw new IdentityTokenInvalidError();
      return { subject: payload.sub, email, fullName: readFullName(payload) };
    },
  };

  // Catch de fronteira (code-standart §7): a jose lanca a hierarquia dela, e
  // dela nao pode vazar nada para o filtro global — nem a causa, nem o token.
  async function verifyPayload(idToken: string): Promise<JWTPayload> {
    try {
      const verified = await jwtVerify(idToken, remoteKeySet, {
        issuer: [...issuers],
        audience: clientId,
      });
      return verified.payload;
    } catch {
      throw new IdentityTokenInvalidError();
    }
  }
}
