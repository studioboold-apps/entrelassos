/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { AuthenticatedUser } from '../auth/authenticated-user.interface';
import type { HttpMethod } from './http.constant';

export type PublicRouteHandlerParams = {
  readonly request: Request;
  readonly url: URL;
  readonly pathParams: Readonly<Record<string, string>>;
};

export type RouteHandlerParams = PublicRouteHandlerParams & {
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

/**
 * Tabela SEPARADA, e nao um sinalizador `isPublic` na tabela autenticada: com
 * duas tabelas o tipo do handler publico nao tem usuario nenhum, entao nao
 * existe rota autenticada que leia um usuario opcional e siga em frente.
 */
export type PublicRouteDefinition = {
  readonly method: HttpMethod;
  readonly path: string;
  readonly summary: string;
  readonly handle: (params: PublicRouteHandlerParams) => Promise<Response>;
};
