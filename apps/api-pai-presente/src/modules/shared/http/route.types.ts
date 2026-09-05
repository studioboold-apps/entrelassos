/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { AuthenticatedUser } from '../auth/authenticated-user.interface';
import type { HttpMethod } from './http.constant';

export type RouteHandlerParams = {
  readonly request: Request;
  readonly url: URL;
  readonly pathParams: Readonly<Record<string, string>>;
  readonly authenticatedUser: AuthenticatedUser;
};

/**
 * Rota e DADO, nao codigo espalhado: o despacho e a documentacao OpenAPI saem
 * da mesma tabela, e assim nao existe rota documentada que ninguem serve.
 */
export type RouteDefinition = {
  readonly method: HttpMethod;
  readonly path: string;
  readonly summary: string;
  readonly handle: (params: RouteHandlerParams) => Promise<Response>;
};
