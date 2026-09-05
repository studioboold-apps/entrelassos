/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { DEVELOPMENT_AUTH_PROVIDER } from '../modules/Auth/auth.constant';
import {
  SEED_ACTIVITIES,
  SEED_CHAT_CONVERSATION_ID,
  SEED_CHAT_MESSAGES,
  SEED_CHILDREN,
  SEED_PARENT_ID_TOKEN,
  SEED_PARENT_PROFILE,
  SEED_POSTS,
} from './seed.constant';
import type {
  RunSeedParams,
  SeedActivityPort,
  SeedChatMessagePort,
  SeedChildPort,
  SeedCommunityCommentPort,
  SeedCommunityPostPort,
  SeedSummary,
} from './seed.types';

const ISO_DATE_LENGTH = 10;

/**
 * Idempotencia por CONTEUDO, nunca por contagem: "ja tem filho, entao pulo tudo"
 * deixaria o seed pela metade para sempre se uma rodada morresse no meio.
 */
function missingBy<TItem>(
  items: readonly TItem[],
  existing: ReadonlySet<string>,
  keyOf: (item: TItem) => string,
): readonly TItem[] {
  return items.filter((item) => !existing.has(keyOf(item)));
}

function toIsoDate({ today, dayOffset }: { readonly today: Date; readonly dayOffset: number }): string {
  const shifted = new Date(today.getTime());
  shifted.setUTCDate(shifted.getUTCDate() + dayOffset);
  return shifted.toISOString().slice(0, ISO_DATE_LENGTH);
}

type SeedChildrenResult = { readonly created: number; readonly idByName: Map<string, string> };

async function seedChildren(params: {
  readonly port: SeedChildPort;
  readonly userId: string;
}): Promise<SeedChildrenResult> {
  const { port, userId } = params;
  const idByName = new Map((await port.list(userId)).map((child) => [child.name, child.id]));
  const missing = missingBy(SEED_CHILDREN, new Set(idByName.keys()), (child) => child.name);

  const created = await Promise.all(missing.map((values) => port.create({ userId, values })));
  for (const child of created) idByName.set(child.name, child.id);

  return { created: created.length, idByName };
}

async function seedActivities(params: {
  readonly port: SeedActivityPort;
  readonly userId: string;
  readonly childIdByName: ReadonlyMap<string, string>;
  readonly today: Date;
}): Promise<number> {
  const { port, userId, childIdByName, today } = params;
  const existing = new Set(await port.listTitles(userId));
  const missing = missingBy(SEED_ACTIVITIES, existing, (activity) => activity.values.title);

  await Promise.all(
    missing.map(({ childName, dayOffset, values }) => {
      const childId = childIdByName.get(childName);
      if (childId === undefined) throw new Error(`seed sem filho para a atividade: ${childName}`);
      return port.create({
        userId,
        values: { ...values, activityDate: toIsoDate({ today, dayOffset }), childId },
      });
    }),
  );

  return missing.length;
}

async function seedComments(params: {
  readonly port: SeedCommunityCommentPort;
  readonly userId: string;
  readonly postId: string;
  readonly contents: readonly string[];
}): Promise<number> {
  const { port, userId, postId, contents } = params;
  if (contents.length === 0) return 0;

  const existing = new Set(await port.listContents(postId));
  const missing = missingBy(contents, existing, (content) => content);
  await Promise.all(
    missing.map((content) => port.create({ authorId: userId, values: { postId, content } })),
  );

  return missing.length;
}

type CommunityTally = { posts: number; comments: number; likes: number };

async function seedCommunity(params: {
  readonly posts: SeedCommunityPostPort;
  readonly comments: SeedCommunityCommentPort;
  readonly userId: string;
}): Promise<CommunityTally> {
  const { posts, comments, userId } = params;
  const byContent = new Map((await posts.list(userId)).map((post) => [post.content, post]));
  const tally: CommunityTally = { posts: 0, comments: 0, likes: 0 };

  for (const fixture of SEED_POSTS) {
    const existing = byContent.get(fixture.values.content);
    const post = existing ?? (await posts.create({ authorId: userId, values: fixture.values }));
    if (existing === undefined) tally.posts += 1;

    if (fixture.isLiked && !post.hasLiked) {
      await posts.like({ postId: post.id, userId });
      tally.likes += 1;
    }

    tally.comments += await seedComments({
      port: comments,
      userId,
      postId: post.id,
      contents: fixture.comments,
    });
  }

  return tally;
}

async function seedChat(params: {
  readonly port: SeedChatMessagePort;
  readonly userId: string;
}): Promise<number> {
  const { port, userId } = params;
  const conversationId = SEED_CHAT_CONVERSATION_ID;
  const existing = new Set(await port.listContents({ userId, conversationId }));
  const missing = missingBy(SEED_CHAT_MESSAGES, existing, (message) => message.content);

  await Promise.all(
    missing.map((message) => port.create({ userId, values: { ...message, conversationId } })),
  );

  return missing.length;
}

/**
 * O pai nasce pelo login de desenvolvimento (`F1.2`) porque e assim que ele vai
 * ENTRAR: criado por fora, o subject seria outro e o dado semeado nao teria dono
 * alcancavel pela tela. O seed sai da sessao no fim — semear nao e estar logado.
 */
export async function runSeed({ ports, today }: RunSeedParams): Promise<SeedSummary> {
  const session = await ports.auth.signIn({
    provider: DEVELOPMENT_AUTH_PROVIDER,
    idToken: SEED_PARENT_ID_TOKEN,
  });
  const userId = session.userId;
  await ports.users.updateProfile({ userId, values: SEED_PARENT_PROFILE });

  const children = await seedChildren({ port: ports.children, userId });
  const activities = await seedActivities({
    port: ports.activities,
    userId,
    childIdByName: children.idByName,
    today,
  });
  const community = await seedCommunity({
    posts: ports.posts,
    comments: ports.comments,
    userId,
  });
  const chatMessages = await seedChat({ port: ports.chat, userId });

  await ports.auth.signOut(session.refreshTokenValue);

  return {
    userId,
    children: children.created,
    activities,
    posts: community.posts,
    comments: community.comments,
    likes: community.likes,
    chatMessages,
  };
}
