/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { IdentityTokenInvalidError } from '../auth.error';
import type { IdentityVerifier, ProviderIdentity } from '../types/auth.types';

/** Simples de proposito: o suficiente para recusar "qualquer-coisa" como login. */
const EMAIL_PATTERN = /^[^\s@|]+@[^\s@|]+\.[^\s@|]+$/;
const NAME_SEPARATOR = '|';
const DEVELOPMENT_SUBJECT_PREFIX = 'dev:';

/**
 * O "token" aqui e o proprio email, opcionalmente seguido do nome
 * (`pai@teste.dev|Joao da Silva`): sem o nome, todo pai criado em
 * desenvolvimento nasceria anonimo, e a tela de perfil nao teria o que desenhar.
 *
 * Nada disto e' verificado — e por isso o registro impede que exista em producao.
 */
export function createDevelopmentVerifier(): IdentityVerifier {
  return {
    verify(idToken: string): Promise<ProviderIdentity> {
      const [email = '', fullName = ''] = idToken.split(NAME_SEPARATOR);
      if (!EMAIL_PATTERN.test(email)) return Promise.reject(new IdentityTokenInvalidError());

      return Promise.resolve({
        subject: `${DEVELOPMENT_SUBJECT_PREFIX}${email}`,
        email,
        fullName: fullName.length > 0 ? fullName : undefined,
      });
    },
  };
}
