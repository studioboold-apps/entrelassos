/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';

import { createDatabaseClient, type Database } from '../database/client';
import { auditLogTable } from '../modules/Audit/audit.table';
import { AUDIT_ACTIONS } from '../modules/Audit/audit.constant';
import { activitiesTable } from '../modules/Activity/activity.table';
import { authIdentitiesTable, sessionsTable } from '../modules/Auth/auth.table';
import { DEVELOPMENT_AUTH_PROVIDER, SESSIONS_PATH } from '../modules/Auth/auth.constant';
import { chatMessagesTable } from '../modules/ChatMessage/chat-message.table';
import { childrenTable } from '../modules/Child/child.table';
import { communityCommentsTable } from '../modules/CommunityComment/community-comment.table';
import {
  communityPostLikesTable,
  communityPostsTable,
} from '../modules/CommunityPost/community-post.table';
import { insightRatingsTable } from '../modules/InsightRating/insight-rating.table';
import { usersTable } from '../modules/User/user.table';
import { ME_EXPORT_PATH, ME_PATH } from '../modules/User/user.constant';
import { HTTP_METHODS, HTTP_STATUS } from '../modules/shared/http/http.constant';
import {
  readEndToEndEnvironment,
  startEndToEndApi,
  type EndToEndApi,
} from '../testing/e2e-server.util';
import { readDataRecord, type TestClient } from '../testing/http-test.util';

const IS_ENABLED = Bun.env.PP_E2E === '1';

const BOOT_TIMEOUT_MS = 30_000;
const NOT_FOUND_STATUS = 404;
const RUN_ID = randomUUID();
const PARENT_EMAIL = `remocao-${RUN_ID}@teste.dev`;
const PARENT_ID_TOKEN = `${PARENT_EMAIL}|Pai que Vai Embora`;
const TODAY = new Date().toISOString().slice(0, 10);
const CLIENT_IP = '203.0.113.44';

/**
 * As DEZ tabelas do esquema, cada uma com a coluna que aponta para o dono. E a
 * lista que o aceite do `F3.2` cobra: prova de que nada do usuario sobrou.
 *
 * A varredura e por TABELA, nao pela API: perguntar `GET /v1/children` depois de
 * apagar responderia lista vazia mesmo com as linhas intactas no banco, porque a
 * consulta e escopada pelo dono que acabou de sumir. So o banco prova.
 */
type OwnedTable = {
  readonly name: string;
  readonly find: (database: Database, userId: string) => Promise<readonly unknown[]>;
};

const OWNED_TABLES: readonly OwnedTable[] = [
  {
    name: 'users',
    find: (database, userId) =>
      database.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, userId)),
  },
  {
    name: 'auth_identities',
    find: (database, userId) =>
      database
        .select({ id: authIdentitiesTable.id })
        .from(authIdentitiesTable)
        .where(eq(authIdentitiesTable.userId, userId)),
  },
  {
    name: 'sessions',
    find: (database, userId) =>
      database
        .select({ id: sessionsTable.id })
        .from(sessionsTable)
        .where(eq(sessionsTable.userId, userId)),
  },
  {
    name: 'children',
    find: (database, userId) =>
      database
        .select({ id: childrenTable.id })
        .from(childrenTable)
        .where(eq(childrenTable.userId, userId)),
  },
  {
    name: 'activities',
    find: (database, userId) =>
      database
        .select({ id: activitiesTable.id })
        .from(activitiesTable)
        .where(eq(activitiesTable.userId, userId)),
  },
  {
    name: 'insight_ratings',
    find: (database, userId) =>
      database
        .select({ id: insightRatingsTable.id })
        .from(insightRatingsTable)
        .where(eq(insightRatingsTable.userId, userId)),
  },
  {
    name: 'community_posts',
    find: (database, userId) =>
      database
        .select({ id: communityPostsTable.id })
        .from(communityPostsTable)
        .where(eq(communityPostsTable.authorId, userId)),
  },
  {
    name: 'community_post_likes',
    find: (database, userId) =>
      database
        .select({ postId: communityPostLikesTable.postId })
        .from(communityPostLikesTable)
        .where(eq(communityPostLikesTable.userId, userId)),
  },
  {
    name: 'community_comments',
    find: (database, userId) =>
      database
        .select({ id: communityCommentsTable.id })
        .from(communityCommentsTable)
        .where(eq(communityCommentsTable.authorId, userId)),
  },
  {
    name: 'chat_messages',
    find: (database, userId) =>
      database
        .select({ id: chatMessagesTable.id })
        .from(chatMessagesTable)
        .where(eq(chatMessagesTable.userId, userId)),
  },
];

function readId(record: Record<string, unknown>): string {
  const { id } = record;
  if (typeof id !== 'string') throw new Error('recurso criado sem id');
  return id;
}

describe.skipIf(!IS_ENABLED)('apagar a conta leva tudo junto', () => {
  let api: EndToEndApi;
  let client: TestClient;
  let database: Database;
  let userId = '';

  beforeAll(async () => {
    api = await startEndToEndApi();
    client = api.client;
    const databaseUrl = readEndToEndEnvironment().DATABASE_URL ?? '';
    database = createDatabaseClient(databaseUrl);
  }, BOOT_TIMEOUT_MS);

  afterAll(async () => {
    await api?.stop();
  });

  test('a conta nasce com linha em todas as tabelas', async () => {
    const session = await client.send({
      method: HTTP_METHODS.POST,
      path: SESSIONS_PATH,
      body: { provider: DEVELOPMENT_AUTH_PROVIDER, idToken: PARENT_ID_TOKEN },
    });
    expect(session.status).toBe(HTTP_STATUS.CREATED);
    const sessionUser = readDataRecord(session).user;
    userId = readId(sessionUser as Record<string, unknown>);

    const child = await client.send({
      method: HTTP_METHODS.POST,
      path: '/v1/children',
      body: { name: 'Filha', age: 6, gender: 'feminino' },
    });
    const childId = readId(readDataRecord(child));

    await client.send({
      method: HTTP_METHODS.POST,
      path: '/v1/activities',
      body: { title: `Praia ${RUN_ID}`, activityDate: TODAY, childId },
    });

    await client.send({
      method: HTTP_METHODS.PUT,
      path: `/v1/insight-ratings/insight-${RUN_ID}`,
      body: { category: 'comportamento', rating: 5 },
    });

    const post = await client.send({
      method: HTTP_METHODS.POST,
      path: '/v1/community/posts',
      body: { content: `Primeiro dia de aula ${RUN_ID}`, category: 'experiencia' },
    });
    const postId = readId(readDataRecord(post));

    await client.send({ method: HTTP_METHODS.PUT, path: `/v1/community/posts/${postId}/like` });

    await client.send({
      method: HTTP_METHODS.POST,
      path: '/v1/community/comments',
      body: { postId, content: 'Que bom!' },
    });

    await client.send({
      method: HTTP_METHODS.POST,
      path: '/v1/chat/messages',
      body: { conversationId: randomUUID(), role: 'user', content: 'oi' },
    });

    const populated: Record<string, boolean> = {};
    for (const table of OWNED_TABLES) {
      populated[table.name] = (await table.find(database, userId)).length > 0;
    }

    expect(populated).toEqual({
      users: true,
      auth_identities: true,
      sessions: true,
      children: true,
      activities: true,
      insight_ratings: true,
      community_posts: true,
      community_post_likes: true,
      community_comments: true,
      chat_messages: true,
    });
  });

  /**
   * Portabilidade (LGPD art. 18 V) tem de vir ANTES da eliminacao no teste, pelo
   * mesmo motivo que vem antes na vida: depois de apagar nao ha o que exportar.
   */
  test('a exportacao traz o que o pai escreveu, e nenhum segredo de sessao', async () => {
    const response = await client.send({ method: HTTP_METHODS.GET, path: ME_EXPORT_PATH });

    expect(response.status).toBe(HTTP_STATUS.OK);
    const payload = readDataRecord(response);
    expect(payload.user).toMatchObject({ email: PARENT_EMAIL });
    expect(payload.children).toHaveLength(1);

    /**
     * O hash do refresh e' material de credencial, nao dado pessoal do titular:
     * um arquivo baixado com ele dentro vira chave de sessao em qualquer lugar
     * onde o arquivo for parar. `sessions` fica de fora da exportacao de
     * proposito — e' a unica das dez que fica.
     */
    expect(JSON.stringify(payload)).not.toContain('refreshTokenHash');
  });

  test('apagar responde 204 e nao sobra linha em nenhuma das dez tabelas', async () => {
    const removed = await client.send({
      method: HTTP_METHODS.DELETE,
      path: ME_PATH,
      headers: { 'x-forwarded-for': CLIENT_IP },
    });
    expect(removed.status).toBe(HTTP_STATUS.NO_CONTENT);

    const survivors: Record<string, number> = {};
    for (const table of OWNED_TABLES) {
      survivors[table.name] = (await table.find(database, userId)).length;
    }

    expect(survivors).toEqual({
      users: 0,
      auth_identities: 0,
      sessions: 0,
      children: 0,
      activities: 0,
      insight_ratings: 0,
      community_posts: 0,
      community_post_likes: 0,
      community_comments: 0,
      chat_messages: 0,
    });
  });

  /**
   * A trilha e' a decima primeira tabela, e a unica que NAO cascateia com o
   * usuario: se ela sumisse junto, nao restaria prova de que a exclusao
   * aconteceu — que e' precisamente o registro que o §10 da `security.md`
   * manda guardar em toda acao sensivel.
   */
  test('a trilha sobrevive a conta, com ator, alvo e endereco', async () => {
    const trail = await database
      .select()
      .from(auditLogTable)
      .where(eq(auditLogTable.actorId, userId));

    const removal = trail.find((entry) => entry.action === AUDIT_ACTIONS.ACCOUNT_DELETED);
    expect(removal).toMatchObject({ actorId: userId, targetId: userId, clientIp: CLIENT_IP });

    const exported = trail.find((entry) => entry.action === AUDIT_ACTIONS.ACCOUNT_EXPORTED);
    expect(exported).toBeDefined();
  });

  test('a sessao antiga nao ressuscita a conta', async () => {
    const response = await client.send({ method: HTTP_METHODS.GET, path: ME_PATH });

    expect(response.status).toBe(NOT_FOUND_STATUS);
  });
});
