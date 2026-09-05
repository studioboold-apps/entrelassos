/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import {
  SEED_ACTIVITIES,
  SEED_CHAT_CONVERSATION_ID,
  SEED_CHAT_MESSAGES,
  SEED_CHILDREN,
  SEED_PARENT_EMAIL,
  SEED_POSTS,
} from './seed.constant';
import { runSeed } from './seed.service';
import type { SeedPorts, SeedSummary } from './seed.types';

const PARENT_ID = '11111111-1111-4111-8111-111111111111';
const TODAY = new Date('2026-09-05T12:00:00.000Z');
const TODAY_ISO = '2026-09-05';

type StoredActivity = {
  readonly userId: string;
  readonly title: string;
  readonly activityDate: string;
  readonly childId: string | undefined;
  readonly isCompleted: boolean;
};

type StoredPost = { readonly id: string; content: string; hasLiked: boolean };

type Store = {
  readonly children: { id: string; userId: string; name: string; age: number }[];
  readonly activities: StoredActivity[];
  readonly posts: StoredPost[];
  readonly comments: { postId: string; content: string }[];
  readonly chat: { conversationId: string; role: string; content: string }[];
  readonly profileUpdates: string[];
  readonly signIns: string[];
  readonly signOuts: number;
};

function createStore(): Store {
  return {
    children: [],
    activities: [],
    posts: [],
    comments: [],
    chat: [],
    profileUpdates: [],
    signIns: [],
    signOuts: 0,
  };
}

/** Cresce so o suficiente para o seed distinguir uma linha da outra. */
function nextId(prefix: string, count: number): string {
  return `${prefix}-${count}`;
}

function createPorts(store: Store): SeedPorts {
  return {
    auth: {
      signIn: async ({ idToken }) => {
        store.signIns.push(idToken);
        return { userId: PARENT_ID, refreshTokenValue: 'refresh' };
      },
      signOut: async () => {
        (store as { signOuts: number }).signOuts += 1;
      },
    },
    users: {
      updateProfile: async ({ userId }) => {
        store.profileUpdates.push(userId);
      },
    },
    children: {
      list: async (userId) => store.children.filter((child) => child.userId === userId),
      create: async ({ userId, values }) => {
        const created = {
          id: nextId('child', store.children.length),
          userId,
          name: values.name,
          age: values.age,
        };
        store.children.push(created);
        return created;
      },
    },
    activities: {
      listTitles: async (userId) =>
        store.activities.filter((row) => row.userId === userId).map((row) => row.title),
      create: async ({ userId, values }) => {
        store.activities.push({
          userId,
          title: values.title,
          activityDate: values.activityDate,
          childId: values.childId,
          isCompleted: values.isCompleted === true,
        });
      },
    },
    posts: {
      list: async () => store.posts,
      create: async ({ values }) => {
        const created = { id: nextId('post', store.posts.length), content: values.content, hasLiked: false };
        store.posts.push(created);
        return created;
      },
      like: async ({ postId }) => {
        const post = store.posts.find((row) => row.id === postId);
        if (post !== undefined) post.hasLiked = true;
      },
    },
    comments: {
      listContents: async (postId) =>
        store.comments.filter((row) => row.postId === postId).map((row) => row.content),
      create: async ({ values }) => {
        store.comments.push({ postId: values.postId, content: values.content });
      },
    },
    chat: {
      listContents: async ({ conversationId }) =>
        store.chat.filter((row) => row.conversationId === conversationId).map((row) => row.content),
      create: async ({ values }) => {
        store.chat.push({
          conversationId: values.conversationId,
          role: values.role,
          content: values.content,
        });
      },
    },
  };
}

async function seedInto(store: Store): Promise<SeedSummary> {
  return await runSeed({ ports: createPorts(store), today: TODAY });
}

describe('seed em banco limpo', () => {
  test('cria o pai, os filhos, as atividades, a comunidade e a conversa', async () => {
    const store = createStore();
    const summary = await seedInto(store);

    expect(summary.userId).toBe(PARENT_ID);
    expect(store.signIns[0]).toContain(SEED_PARENT_EMAIL);
    expect(store.profileUpdates).toEqual([PARENT_ID]);
    expect(summary.children).toBe(SEED_CHILDREN.length);
    expect(summary.activities).toBe(SEED_ACTIVITIES.length);
    expect(summary.posts).toBe(SEED_POSTS.length);
    expect(summary.chatMessages).toBe(SEED_CHAT_MESSAGES.length);
  });

  test('os dois filhos tem idades diferentes', async () => {
    const store = createStore();
    await seedInto(store);

    const ages = store.children.map((child) => child.age);
    expect(ages.length).toBe(2);
    expect(new Set(ages).size).toBe(2);
  });

  test('toda atividade aponta para um filho que o seed criou', async () => {
    const store = createStore();
    await seedInto(store);

    const childIds = new Set(store.children.map((child) => child.id));
    for (const activity of store.activities) {
      expect(childIds.has(activity.childId ?? '')).toBe(true);
    }
  });

  test('as atividades cobrem concluida e pendente, passado e futuro', async () => {
    const store = createStore();
    await seedInto(store);

    const states = store.activities.map((row) => row.isCompleted);
    expect(states).toContain(true);
    expect(states).toContain(false);

    const dates = store.activities.map((row) => row.activityDate).sort();
    /** O padrao e HOJE de proposito: lista vazia reprova as duas comparacoes. */
    const earliest = dates.at(0) ?? TODAY_ISO;
    const latest = dates.at(-1) ?? TODAY_ISO;
    expect(earliest < TODAY_ISO).toBe(true);
    expect(latest > TODAY_ISO).toBe(true);
  });

  test('ha post com comentario e post com curtida', async () => {
    const store = createStore();
    const summary = await seedInto(store);

    expect(store.comments.length).toBeGreaterThan(0);
    expect(summary.likes).toBeGreaterThan(0);
    expect(store.posts.some((post) => post.hasLiked)).toBe(true);
  });

  test('a conversa tem os dois lados falando', async () => {
    const store = createStore();
    await seedInto(store);

    const roles = store.chat.map((row) => row.role);
    expect(roles).toContain('user');
    expect(roles).toContain('assistant');
    expect(store.chat.every((row) => row.conversationId === SEED_CHAT_CONVERSATION_ID)).toBe(true);
  });

  test('nao deixa sessao aberta atras de si', async () => {
    const store = createStore();
    await seedInto(store);

    expect(store.signOuts).toBe(1);
  });
});

describe('seed rodado duas vezes', () => {
  test('a segunda rodada nao cria nada', async () => {
    const store = createStore();
    await seedInto(store);
    const second = await seedInto(store);

    expect(second).toEqual({
      userId: PARENT_ID,
      children: 0,
      activities: 0,
      posts: 0,
      comments: 0,
      likes: 0,
      chatMessages: 0,
    });
  });

  test('a segunda rodada nao duplica linha nenhuma', async () => {
    const store = createStore();
    await seedInto(store);
    const afterFirst = {
      children: store.children.length,
      activities: store.activities.length,
      posts: store.posts.length,
      comments: store.comments.length,
      chat: store.chat.length,
    };

    await seedInto(store);

    expect({
      children: store.children.length,
      activities: store.activities.length,
      posts: store.posts.length,
      comments: store.comments.length,
      chat: store.chat.length,
    }).toEqual(afterFirst);
  });
});
