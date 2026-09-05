/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { AuthenticatedUserResolver } from '../auth/authenticated-user.interface';
import { RouteNotFoundError, UnauthenticatedError } from '../errors/shared.error';
import { handleUncaughtError } from './exception-filter';
import { stampTraceId } from './response.util';
import type {
  PublicRouteDefinition,
  RouteDefinition,
  RouteHandlerParams,
} from './route.types';

type AnyRoute = RouteDefinition | PublicRouteDefinition;

type RouteMatch<TRoute extends AnyRoute> = {
  readonly route: TRoute;
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

function findRoute<TRoute extends AnyRoute>(
  routes: readonly TRoute[],
  method: string,
  requestPath: string,
): RouteMatch<TRoute> | undefined {
  for (const route of routes) {
    if (route.method !== method) continue;
    const pathParams = matchPath(route.path, requestPath);
    if (pathParams !== undefined) return { route, pathParams };
  }
  return undefined;
}

export type CreateRouterParams = {
  readonly routes: readonly RouteDefinition[];
  readonly publicRoutes?: readonly PublicRouteDefinition[] | undefined;
  readonly authenticatedUserResolver: AuthenticatedUserResolver;
};

export type Router = {
  handle(request: Request): Promise<Response>;
};

export function createRouter(params: CreateRouterParams): Router {
  const { routes, authenticatedUserResolver } = params;
  const publicRoutes = params.publicRoutes ?? [];

  return {
    async handle(request: Request): Promise<Response> {
      const url = new URL(request.url);
      const traceId = crypto.randomUUID();
      try {
        const publicMatch = findRoute(publicRoutes, request.method, url.pathname);
        if (publicMatch !== undefined) {
          return stampTraceId(
            await publicMatch.route.handle({
              request,
              url,
              pathParams: publicMatch.pathParams,
            }),
            traceId,
          );
        }

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
        return stampTraceId(await match.route.handle(handlerParams), traceId);
      } catch (error) {
        return stampTraceId(
          handleUncaughtError({ error, method: request.method, path: url.pathname, traceId }),
          traceId,
        );
      }
    },
  };
}
