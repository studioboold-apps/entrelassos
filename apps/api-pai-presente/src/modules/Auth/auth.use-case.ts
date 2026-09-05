/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { AuthenticatedUser } from '../shared/auth/authenticated-user.interface';
import { RefreshTokenInvalidError, ProviderNotConfiguredError } from './auth.error';
import { REFRESH_TOKEN_TTL_SECONDS } from './auth.constant';
import type {
  AuthAccountRepository,
  AuthUseCases,
  IdentityVerifierRegistry,
  IssuedSession,
  SessionRecord,
  SessionRepository,
  SignInParams,
  TokenService,
} from './types/auth.types';

export type CreateAuthUseCasesParams = {
  readonly verifiers: IdentityVerifierRegistry;
  readonly accounts: AuthAccountRepository;
  readonly sessions: SessionRepository;
  readonly tokenService: TokenService;
};

export function createAuthUseCases({
  verifiers,
  accounts,
  sessions,
  tokenService,
}: CreateAuthUseCasesParams): AuthUseCases {
  async function issueSession(user: AuthenticatedUser): Promise<IssuedSession> {
    const refreshToken = tokenService.issueRefreshToken();
    await sessions.insert({
      userId: user.userId,
      refreshTokenHash: refreshToken.hash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
    });
    return {
      user,
      accessToken: await tokenService.mintAccessToken(user),
      refreshTokenValue: refreshToken.value,
    };
  }

  // Refresh apresentado depois de revogado e sinal de token roubado: quem tem o
  // valor antigo nao e mais o dono legitimo, entao TODAS as sessoes caem.
  async function assertSessionIsUsable(session: SessionRecord): Promise<void> {
    if (session.revokedAt !== null) {
      await sessions.revokeAllForUser(session.userId);
      throw new RefreshTokenInvalidError();
    }
    if (session.expiresAt.getTime() <= Date.now()) throw new RefreshTokenInvalidError();
  }

  return {
    async signIn({ provider, idToken }: SignInParams): Promise<IssuedSession> {
      const verifier = verifiers.forProvider(provider);
      if (verifier === undefined) throw new ProviderNotConfiguredError(provider);

      const identity = await verifier.verify(idToken);
      const user = await accounts.findOrCreateByIdentity({ provider, identity });
      return await issueSession(user);
    },

    async refreshSession(refreshTokenValue: string): Promise<IssuedSession> {
      const hash = tokenService.hashRefreshToken(refreshTokenValue);
      const session = await sessions.findByRefreshTokenHash(hash);
      if (session === undefined) throw new RefreshTokenInvalidError();

      await assertSessionIsUsable(session);
      await sessions.revokeById(session.id);
      return await issueSession(await accounts.findById(session.userId));
    },

    async signOut(refreshTokenValue: string): Promise<void> {
      const hash = tokenService.hashRefreshToken(refreshTokenValue);
      const session = await sessions.findByRefreshTokenHash(hash);
      if (session !== undefined) await sessions.revokeById(session.id);
    },
  };
}
