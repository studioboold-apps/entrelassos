/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { toApiPayload, toPagePayload } from './keys';

/**
 * Vazio em desenvolvimento: o proxy do Vite manda `/v1` para a API local.
 * Em producao a API pode estar em outro host, e ai a variavel de build diz qual.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export const HTTP_METHODS = Object.freeze({
  GET: 'GET',
  POST: 'POST',
  PATCH: 'PATCH',
  PUT: 'PUT',
  DELETE: 'DELETE',
});

const SESSIONS_PATH = '/v1/auth/sessions';
const JSON_HEADERS = Object.freeze({ 'Content-Type': 'application/json' });
const HTTP_UNAUTHORIZED = 401;
const HTTP_NO_CONTENT = 204;

export class ApiError extends Error {
  constructor({ status, code, message, details }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    /** `apis.md`: a recusa nomeia TODOS os campos, e a tela precisa deles. */
    this.details = details ?? [];
  }
}

/**
 * Uma renovacao por vez: sem isto, cinco `useQuery` que expiram juntos disparam
 * cinco rotacoes de refresh token, e a rotacao invalida a anterior — o usuario
 * cairia para fora justamente por ter varias telas abertas.
 */
let renewalInFlight = null;

function renewSession() {
  renewalInFlight ??= fetch(`${API_BASE_URL}${SESSIONS_PATH}`, {
    method: HTTP_METHODS.PUT,
    credentials: 'include',
  })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      renewalInFlight = null;
    });
  return renewalInFlight;
}

export function buildUrl(path, query) {
  const params = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });
  const search = params.toString();
  return search === '' ? `${API_BASE_URL}${path}` : `${API_BASE_URL}${path}?${search}`;
}

async function readError(response) {
  const payload = await response.json().catch(() => undefined);
  const failure = payload?.error;
  return new ApiError({
    status: response.status,
    code: failure?.code ?? 'HTTP_ERROR',
    message: failure?.message ?? `A API respondeu ${response.status}.`,
    details: failure?.details,
  });
}

/**
 * Cookie `HttpOnly` em vez de token no `localStorage` (`security.md` §8):
 * por isso `credentials: 'include'` em toda chamada, e nenhum header de sessao.
 *
 * A renovacao vive aqui, e nao dentro do `send`, porque o upload precisa dela
 * igual: o pai que escolhe a foto depois de vinte minutos parado tem a sessao
 * expirada, e perder o arquivo escolhido por 401 e' pedir para ele achar a foto
 * outra vez. Reenviar e' seguro porque o corpo e' um `FormData`, nao um fluxo
 * ja consumido.
 */
async function fetchWithRenewal({ method, path, url, init, canRenew }) {
  const response = await fetch(url, { method, credentials: 'include', ...init });

  if (response.status === HTTP_UNAUTHORIZED && canRenew && path !== SESSIONS_PATH) {
    const renewed = await renewSession();
    if (renewed) return fetchWithRenewal({ method, path, url, init, canRenew: false });
  }

  return response;
}

async function send(method, path, options) {
  const { query, body, aliases, canRenew = true } = options;
  const response = await fetchWithRenewal({
    method,
    path,
    url: buildUrl(path, query),
    canRenew,
    init: {
      headers: body === undefined ? undefined : JSON_HEADERS,
      body: body === undefined ? undefined : JSON.stringify(toApiPayload(body, aliases)),
    },
  });

  if (!response.ok) throw await readError(response);
  if (response.status === HTTP_NO_CONTENT) return undefined;
  return response.json();
}

/** Devolve o conteudo de `data`, que e onde a API poe tudo (`apis.md`). */
export async function request(method, path, options = {}) {
  const payload = await send(method, path, options);
  return payload === undefined ? undefined : toPagePayload(payload.data, options.aliases);
}

/**
 * Arquivo nao passa pelo `send`, e nao e' por gosto: ele serializa TODO corpo em
 * JSON, e um `File` atravessando `JSON.stringify` chega na API como `{}` — sem
 * erro nenhum, so' sem o arquivo.
 *
 * O `Content-Type` fica de fora de proposito. Quem monta o cabecalho e' o
 * navegador, porque so' ele conhece a fronteira (`boundary`) que separa as
 * partes; escrever `multipart/form-data` a mao apaga a fronteira e a API recebe
 * um corpo que nao sabe ler.
 */
export async function requestUpload(path, { form }) {
  const response = await fetchWithRenewal({
    method: HTTP_METHODS.POST,
    path,
    url: buildUrl(path),
    canRenew: true,
    init: { body: form },
  });

  if (!response.ok) throw await readError(response);
  const payload = await response.json();
  return toPagePayload(payload.data);
}

/** Igual, mas devolve tambem o `pagination` — quem pagina precisa do total. */
export async function requestPage(path, options = {}) {
  const payload = await send(HTTP_METHODS.GET, path, options);
  return {
    items: toPagePayload(payload.data, options.aliases),
    pagination: payload.pagination,
  };
}
