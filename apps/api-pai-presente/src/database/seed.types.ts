/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { CreateActivityParams } from '../modules/Activity/types/activity.types';
import type { CreateChatMessageParams } from '../modules/ChatMessage/types/chat-message.types';
import type { CreateChildParams } from '../modules/Child/types/child.types';
import type { CreateCommunityCommentParams } from '../modules/CommunityComment/types/community-comment.types';
import type {
  CreateCommunityPostParams,
  ToggleLikeParams,
} from '../modules/CommunityPost/types/community-post.types';
import type { SignInParams } from '../modules/Auth/types/auth.types';
import type { UpdateUserParams } from '../modules/User/types/user.types';

/**
 * Portas, nao os use cases inteiros: o seed so precisa saber o QUE ja existe
 * (nome, titulo, conteudo) para nao criar de novo. Depender da linha inteira
 * obrigaria todo teste a montar linha de banco para provar idempotencia.
 *
 * Quem escreve continua sendo o use case — o adaptador em `seed.ts` e uma linha.
 */

export type SeedChildRecord = { readonly id: string; readonly name: string };

export type SeedPostRecord = {
  readonly id: string;
  readonly content: string;
  readonly hasLiked: boolean;
};

export type SeedAuthPort = {
  /** Devolve o pai dono do seed; o refresh volta so para o seed poder encerrar. */
  signIn(params: SignInParams): Promise<{
    readonly userId: string;
    readonly refreshTokenValue: string;
  }>;
  signOut(refreshTokenValue: string): Promise<void>;
};

export type SeedUserPort = {
  updateProfile(params: UpdateUserParams): Promise<void>;
};

export type SeedChildPort = {
  list(userId: string): Promise<readonly SeedChildRecord[]>;
  create(params: CreateChildParams): Promise<SeedChildRecord>;
};

export type SeedActivityPort = {
  listTitles(userId: string): Promise<readonly string[]>;
  create(params: CreateActivityParams): Promise<void>;
};

export type SeedCommunityPostPort = {
  list(viewerId: string): Promise<readonly SeedPostRecord[]>;
  create(params: CreateCommunityPostParams): Promise<SeedPostRecord>;
  like(params: ToggleLikeParams): Promise<void>;
};

export type SeedCommunityCommentPort = {
  listContents(postId: string): Promise<readonly string[]>;
  create(params: CreateCommunityCommentParams): Promise<void>;
};

export type SeedChatMessagePort = {
  listContents(params: {
    readonly userId: string;
    readonly conversationId: string;
  }): Promise<readonly string[]>;
  create(params: CreateChatMessageParams): Promise<void>;
};

export type SeedPorts = {
  readonly auth: SeedAuthPort;
  readonly users: SeedUserPort;
  readonly children: SeedChildPort;
  readonly activities: SeedActivityPort;
  readonly posts: SeedCommunityPostPort;
  readonly comments: SeedCommunityCommentPort;
  readonly chat: SeedChatMessagePort;
};

export type RunSeedParams = {
  readonly ports: SeedPorts;
  /** Injetado: o seed precisa de "hoje" e nao pode ter relogio proprio no teste. */
  readonly today: Date;
};

/** Quanto a rodada CRIOU. Segunda rodada em banco semeado sai tudo zero. */
export type SeedSummary = {
  readonly userId: string;
  readonly children: number;
  readonly activities: number;
  readonly posts: number;
  readonly comments: number;
  readonly likes: number;
  readonly chatMessages: number;
};
