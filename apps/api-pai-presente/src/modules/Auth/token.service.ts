/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { createHash, randomBytes } from 'node:crypto';

import { SignJWT, jwtVerify } from 'jose';

import type { AuthenticatedUser } from '../shared/auth/authenticated-user.interface';
import {
  ACCESS_TOKEN_ALGORITHM,
  ACCESS_TOKEN_AUDIENCE,
  ACCESS_TOKEN_ISSUER,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_BYTES,
} from './auth.constant';
import type { RefreshToken, TokenService } from './types/auth.types';

function hashToken(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function readUserFromPayload(payload: Record<string, unknown>): AuthenticatedUser | undefined {
  const { sub, email } = payload;
  if (typeof sub !== 'string' || typeof email !== 'string') return undefined;
  return { userId: sub, email };
}

export function createTokenService(secret: string): TokenService {
  const signingKey = new TextEncoder().encode(secret);

  return {
    async mintAccessToken({ userId, email }: AuthenticatedUser): Promise<string> {
      return await new SignJWT({ email })
        .setProtectedHeader({ alg: ACCESS_TOKEN_ALGORITHM })
        .setSubject(userId)
        .setIssuer(ACCESS_TOKEN_ISSUER)
        .setAudience(ACCESS_TOKEN_AUDIENCE)
        .setIssuedAt()
        .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
        .sign(signingKey);
    },

    // Token vencido, assinatura errada ou audiencia de outro app sao a MESMA
    // coisa para quem chama: nao ha usuario. O 401 vem do roteador.
    async verifyAccessToken(accessToken: string): Promise<AuthenticatedUser | undefined> {
      try {
        const { payload } = await jwtVerify(accessToken, signingKey, {
          issuer: ACCESS_TOKEN_ISSUER,
          audience: ACCESS_TOKEN_AUDIENCE,
          algorithms: [ACCESS_TOKEN_ALGORITHM],
        });
        return readUserFromPayload(payload);
      } catch {
        return undefined;
      }
    },

    issueRefreshToken(): RefreshToken {
      const value = randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
      return { value, hash: hashToken(value) };
    },

    hashRefreshToken: hashToken,
  };
}
