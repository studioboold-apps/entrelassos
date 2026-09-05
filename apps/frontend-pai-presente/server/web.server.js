/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { join, normalize, resolve, sep } from 'node:path';

/**
 * O `dist` do Vite e' estatico, mas o navegador precisa de UMA origem so.
 *
 * O cookie de sessao sai `SameSite=Lax` e sem `Domain` — host-only. Servir a
 * tela num host e a API em outro faria o navegador guardar o cookie no host da
 * API e nao mandar de volta em `fetch` de outro SITE; e em `*.fly.dev`, que
 * esta na Public Suffix List, dois subdominios sao sites DIFERENTES. O pai
 * entraria e continuaria deslogado, sem erro nenhum na tela.
 *
 * Por isso a imagem da web repassa `/v1` para a API, como o proxy do Vite faz
 * em desenvolvimento: mesma origem nos dois ambientes, e `VITE_API_BASE_URL`
 * segue vazia.
 */
const API_PREFIX = '/v1';
const HEALTH_PATH = '/health';
const INDEX_FILE = 'index.html';

/** Arquivo com hash no nome nunca muda de conteudo; o resto pode mudar hoje. */
const IMMUTABLE_PREFIX = '/assets/';
const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable';
const REVALIDATE_CACHE = 'no-cache';

const HTTP_NOT_FOUND = 404;
const HTTP_BAD_GATEWAY = 502;

const HOP_BY_HOP_HEADERS = ['connection', 'keep-alive', 'transfer-encoding', 'upgrade'];

export function isApiPath(pathname) {
  return pathname === API_PREFIX || pathname.startsWith(`${API_PREFIX}/`);
}

/**
 * `..` no caminho pedido pelo navegador leria o disco inteiro. Normalizar nao
 * basta: o teto e' comparado DEPOIS de resolver, porque so ai `/assets/../..`
 * ja virou o que ele realmente aponta.
 */
export function resolveStaticPath({ distDirectory, pathname }) {
  const root = resolve(distDirectory);
  const candidate = resolve(join(root, normalize(decodeURIComponent(pathname))));

  if (candidate !== root && !candidate.startsWith(root + sep)) return undefined;
  return candidate;
}

export function chooseCacheControl(pathname) {
  return pathname.startsWith(IMMUTABLE_PREFIX) ? IMMUTABLE_CACHE : REVALIDATE_CACHE;
}

function buildForwardHeaders(request) {
  const headers = new Headers(request.headers);
  for (const name of HOP_BY_HOP_HEADERS) headers.delete(name);
  return headers;
}

async function forwardToApi({ request, apiOrigin }) {
  const incoming = new URL(request.url);
  const target = new URL(`${incoming.pathname}${incoming.search}`, apiOrigin);

  return fetch(target, {
    method: request.method,
    headers: buildForwardHeaders(request),
    body: request.body,
    redirect: 'manual',
  });
}

async function serveStatic({ distDirectory, pathname }) {
  const filePath = resolveStaticPath({ distDirectory, pathname });
  if (filePath === undefined) return undefined;

  const file = Bun.file(filePath);
  if (!(await file.exists())) return undefined;

  return new Response(file, { headers: { 'Cache-Control': chooseCacheControl(pathname) } });
}

/**
 * A tela e' uma aplicacao de pagina unica: `/perfil` nao existe como arquivo, e
 * responder 404 ali quebraria recarregar a pagina em qualquer rota que nao a
 * raiz. Caminho desconhecido devolve o `index.html`, e o roteador do navegador
 * decide.
 */
async function serveApplicationShell(distDirectory) {
  const shell = Bun.file(join(resolve(distDirectory), INDEX_FILE));
  if (!(await shell.exists())) return new Response('dist ausente', { status: HTTP_NOT_FOUND });

  return new Response(shell, {
    headers: { 'Cache-Control': REVALIDATE_CACHE, 'Content-Type': 'text/html; charset=utf-8' },
  });
}

/**
 * @param {{ port: number, distDirectory: string, apiOrigin: string }} params
 */
export function createWebServer({ port, distDirectory, apiOrigin }) {
  return Bun.serve({
    port,
    async fetch(request) {
      const { pathname } = new URL(request.url);

      if (pathname === HEALTH_PATH) return Response.json({ data: { status: 'ok' } });

      if (isApiPath(pathname)) {
        try {
          return await forwardToApi({ request, apiOrigin });
        } catch {
          /** A API fora do ar e' 502 aqui, nao 500: quem falhou foi o de tras. */
          return new Response(undefined, { status: HTTP_BAD_GATEWAY });
        }
      }

      return (await serveStatic({ distDirectory, pathname })) ?? serveApplicationShell(distDirectory);
    },
  });
}
