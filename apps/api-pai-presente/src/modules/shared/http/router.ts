/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { AuthenticatedUserResolver } from '../auth/authenticated-user.interface';
import { RouteNotFoundError, UnauthenticatedError } from '../errors/shared.error';
import { handleUncaughtError } from './exception-filter';
import type { RouteDefinition, RouteHandlerParams } from './route.types';

type RouteMatch = {
  readonly route: RouteDefinition;
  readonly pathParams: Readonly<Record<string, string>>;
};

function matchPath(
  routePath: string,
  requestPath: string,
): Readonly<Record<string, string>> | undefined {
  const routeSegments = routePath.split('/');
  const requestSegments = requestPath.split('/');
  if (routeSegments.length !== requestSegments.length) return undefined;

  const pathParams: Record<string, string> = {};
  for (const [index, routeSegment] of routeSegments.entries()) {
    const requestSegment = requestSegments[index] ?? '';
    if (routeSegment.startsWith(':')) {
      if (requestSegment.length === 0) return undefined;
      pathParams[routeSegment.slice(1)] = decodeURIComponent(requestSegment);
      continue;
    }
    if (routeSegment !== requestSegment) return undefined;
  }
  return pathParams;
}

function findRoute(
  routes: readonly RouteDefinition[],
  method: string,
  requestPath: string,
): RouteMatch | undefined {
  for (const route of routes) {
    if (route.method !== method) continue;
    const pathParams = matchPath(route.path, requestPath);
    if (pathParams !== undefined) return { route, pathParams };
  }
  return undefined;
}

export type CreateRouterParams = {
  readonly routes: readonly RouteDefinition[];
  readonly authenticatedUserResolver: AuthenticatedUserResolver;
};

export type Router = {
  handle(request: Request): Promise<Response>;
};

export function createRouter({ routes, authenticatedUserResolver }: CreateRouterParams): Router {
  return {
    async handle(request: Request): Promise<Response> {
      const url = new URL(request.url);
      try {
        const match = findRoute(routes, request.method, url.pathname);
        if (match === undefined) throw new RouteNotFoundError();

        const authenticatedUser = await authenticatedUserResolver.resolve(request);
        if (authenticatedUser === undefined) throw new UnauthenticatedError();

        const handlerParams: RouteHandlerParams = {
          request,
          url,
          pathParams: match.pathParams,
          authenticatedUser,
        };
        return await match.route.handle(handlerParams);
      } catch (error) {
        return handleUncaughtError({ error, method: request.method, path: url.pathname });
      }
    },
  };
}
