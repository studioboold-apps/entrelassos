/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { ai } from './ai';
import { HTTP_METHODS, request, requestPage } from './http';

const PATHS = Object.freeze({
  me: '/v1/me',
  sessions: '/v1/auth/sessions',
  children: '/v1/children',
  activities: '/v1/activities',
  insightRatings: '/v1/insight-ratings',
  posts: '/v1/community/posts',
  comments: '/v1/community/comments',
});

/** O teto de `perPage` da API; pedir mais devolve 100 do mesmo jeito. */
const PAGE_SIZE_MAX = 100;

/**
 * A atividade diverge do contrato por mais que maiuscula: `date` e `activityDate`
 * nao se ligam por regra nenhuma, entao a ligacao e escrita.
 */
const ACTIVITY_ALIASES = Object.freeze({
  date: 'activityDate',
  time: 'activityTime',
  completed: 'isCompleted',
});

/**
 * `updateUserBodySchema` e `.strict()` sobre estes quatro campos. Orientacao
 * sexual, religiosa e politica sao dado sensivel (LGPD art. 11) e a permanencia
 * delas e a decisao TL.1 — enquanto ela nao vem, mandar uma so reprovaria a
 * requisicao INTEIRA com 400, e o pai perderia tambem o nome e a idade.
 */
const PROFILE_FIELDS = Object.freeze(['full_name', 'age', 'marital_status', 'onboarding_completed']);

function pickProfileFields(values) {
  return Object.fromEntries(Object.entries(values).filter(([key]) => PROFILE_FIELDS.includes(key)));
}

function buildPageQuery(query, page) {
  return { ...query, page, perPage: PAGE_SIZE_MAX };
}

/**
 * A tela calcula em cima da lista inteira (o boletim soma o mes, o perfil conta
 * as atividades). Devolver so a primeira pagina daria uma conta errada em
 * silencio, que e o pior jeito de errar um numero.
 */
async function listAll(path, options = {}) {
  const first = await requestPage(path, { ...options, query: buildPageQuery(options.query, 1) });
  const totalPages = Math.ceil(first.pagination.total / PAGE_SIZE_MAX);
  if (totalPages <= 1) return first.items;

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_unused, index) =>
      requestPage(path, { ...options, query: buildPageQuery(options.query, index + 2) }),
    ),
  );
  return [...first.items, ...rest.flatMap((chunk) => chunk.items)];
}

const Child = Object.freeze({
  list: () => listAll(PATHS.children),
  create: (values) => request(HTTP_METHODS.POST, PATHS.children, { body: values }),
  update: (childId, values) =>
    request(HTTP_METHODS.PATCH, `${PATHS.children}/${childId}`, { body: values }),
  delete: (childId) => request(HTTP_METHODS.DELETE, `${PATHS.children}/${childId}`),
});

const Activity = Object.freeze({
  list: () => listAll(PATHS.activities, { aliases: ACTIVITY_ALIASES }),
  create: (values) =>
    request(HTTP_METHODS.POST, PATHS.activities, { body: values, aliases: ACTIVITY_ALIASES }),
  update: (activityId, values) =>
    request(HTTP_METHODS.PATCH, `${PATHS.activities}/${activityId}`, {
      body: values,
      aliases: ACTIVITY_ALIASES,
    }),
  delete: (activityId) => request(HTTP_METHODS.DELETE, `${PATHS.activities}/${activityId}`),
});

const InsightRating = Object.freeze({
  list: () => listAll(PATHS.insightRatings),
  /**
   * O insight e gerado na hora e nao tem linha propria: o id dele e a CHAVE da
   * nota, entao vai no caminho, e reavaliar atualiza a mesma linha.
   */
  rate: ({ insight_id: insightId, ...values }) =>
    request(HTTP_METHODS.PUT, `${PATHS.insightRatings}/${insightId}`, { body: values }),
});

const CommunityPost = Object.freeze({
  /** O feed nao pagina na tela; pede um lote e para. */
  list: async (limit) => {
    const { items } = await requestPage(PATHS.posts, { query: { perPage: limit } });
    return items;
  },
  create: (values) => request(HTTP_METHODS.POST, PATHS.posts, { body: values }),
  /** Curtir e um recurso proprio: o cliente nao recalcula mais `liked_by`. */
  like: (postId) => request(HTTP_METHODS.PUT, `${PATHS.posts}/${postId}/like`),
  unlike: (postId) => request(HTTP_METHODS.DELETE, `${PATHS.posts}/${postId}/like`),
  delete: (postId) => request(HTTP_METHODS.DELETE, `${PATHS.posts}/${postId}`),
});

const CommunityComment = Object.freeze({
  listByPost: (postId) => listAll(PATHS.comments, { query: { postId } }),
  create: (values) => request(HTTP_METHODS.POST, PATHS.comments, { body: values }),
  delete: (commentId) => request(HTTP_METHODS.DELETE, `${PATHS.comments}/${commentId}`),
});

const auth = Object.freeze({
  me: () => request(HTTP_METHODS.GET, PATHS.me),
  updateMe: (values) =>
    request(HTTP_METHODS.PATCH, PATHS.me, { body: pickProfileFields(values) }),
  /** O `idToken` vai no CORPO: em query string ele vazaria para log e historico. */
  signIn: ({ provider, idToken }) =>
    request(HTTP_METHODS.POST, PATHS.sessions, { body: { provider, idToken } }),
  logout: () => request(HTTP_METHODS.DELETE, PATHS.sessions),
});

export const api = Object.freeze({
  auth,
  ai,
  entities: Object.freeze({ Child, Activity, InsightRating, CommunityPost, CommunityComment }),
});
