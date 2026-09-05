/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

export type AuthenticatedUser = {
  readonly userId: string;
  readonly email: string;
};

/**
 * A fronteira que TB.6 preenche. As rotas dependem desta interface, nunca de
 * cookie nem de token: trocar o mecanismo de sessao nao remodela rota alguma.
 */
export type AuthenticatedUserResolver = {
  resolve(request: Request): Promise<AuthenticatedUser | undefined>;
};
