/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { CreateActivityBody } from '../modules/Activity/activity.schema';
import type { CreateChatMessageBody } from '../modules/ChatMessage/chat-message.schema';
import type { CreateChildBody } from '../modules/Child/child.schema';
import type { CreateCommunityPostBody } from '../modules/CommunityPost/community-post.schema';
import type { UpdateUserBody } from '../modules/User/user.schema';

/**
 * O pai do seed entra pelo MESMO login que a tela usa (`provider: dev`), porque
 * o dono do dado e o subject que aquele login resolve. Criado por outro caminho,
 * o pai que entrasse no app seria um segundo usuario, e o seed ficaria invisivel.
 */
export const SEED_PARENT_EMAIL = 'pai@teste.dev';
export const SEED_PARENT_FULL_NAME = 'Joao da Silva';

/** O verificador de desenvolvimento le `email|nome` — ver `development.verifier.ts`. */
export const SEED_PARENT_ID_TOKEN = `${SEED_PARENT_EMAIL}|${SEED_PARENT_FULL_NAME}`;

export const SEED_PARENT_PROFILE: UpdateUserBody = {
  fullName: SEED_PARENT_FULL_NAME,
  age: 38,
  maritalStatus: 'casado',
  onboardingCompleted: true,
};

export const SEED_CHILDREN: readonly CreateChildBody[] = [
  {
    name: 'Alice',
    age: 7,
    gender: 'feminino',
    favoriteHobby: 'desenhar',
    favoriteColor: 'lilas',
    favoriteFood: 'panqueca',
    favoriteMovieGenre: 'animacao',
  },
  {
    name: 'Miguel',
    age: 14,
    gender: 'masculino',
    favoriteHobby: 'skate',
    favoriteColor: 'verde',
    favoriteFood: 'lasanha',
    favoriteMovieGenre: 'aventura',
  },
];

export type SeedActivityFixture = {
  readonly childName: string;
  /** Dias a partir de hoje: o seed precisa ter passado, hoje e futuro em toda rodada. */
  readonly dayOffset: number;
  readonly values: Omit<CreateActivityBody, 'activityDate' | 'childId'>;
};

export const SEED_ACTIVITIES: readonly SeedActivityFixture[] = [
  {
    childName: 'Alice',
    dayOffset: -12,
    values: {
      title: 'Piquenique no parque',
      description: 'Levar a pipa e o pao de queijo.',
      activityTime: '10:00',
      category: 'natureza',
      isCompleted: true,
      rating: 5,
      feedback: 'Ela pediu para repetir no fim de semana seguinte.',
    },
  },
  {
    childName: 'Miguel',
    dayOffset: -4,
    values: {
      title: 'Consertar o skate juntos',
      description: 'Trocar os rolamentos e regular o truck.',
      category: 'oficinas',
      isCompleted: true,
    },
  },
  {
    childName: 'Alice',
    dayOffset: 0,
    values: {
      title: 'Ler dois capitulos antes de dormir',
      activityTime: '20:30',
      category: 'educativa',
    },
  },
  {
    childName: 'Miguel',
    dayOffset: 3,
    values: {
      title: 'Visitar o museu de ciencias',
      description: 'Sugestao da IA a partir do interesse por experimentos.',
      category: 'educativa',
      isSuggested: true,
    },
  },
];

export type SeedPostFixture = {
  readonly values: CreateCommunityPostBody;
  readonly isLiked: boolean;
  readonly comments: readonly string[];
};

export const SEED_POSTS: readonly SeedPostFixture[] = [
  {
    values: {
      content: 'Comecei a separar 20 minutos por dia so para ouvir. Mudou o jantar aqui em casa.',
      category: 'experiencia',
    },
    isLiked: true,
    comments: ['Vou tentar essa semana e conto como foi.'],
  },
  {
    values: {
      content: 'Como voces lidam com a adolescencia sem virar o pai que so proibe?',
      category: 'duvida',
    },
    isLiked: false,
    comments: [],
  },
];

/** Fixo de proposito: conversa que muda de id a cada rodada nao e a mesma conversa. */
export const SEED_CHAT_CONVERSATION_ID = '2f6a1f14-5bd0-4d1a-9a1e-7c6c2f0a11d3';

export const SEED_CHAT_MESSAGES: readonly Omit<CreateChatMessageBody, 'conversationId'>[] = [
  { role: 'user', content: 'A Alice tem sete anos e anda com medo de dormir sozinha. Por onde comeco?' },
  {
    role: 'assistant',
    content: 'Comece nomeando o medo com ela, sem corrigir. Depois combinem um ritual curto de fim de dia.',
  },
  { role: 'user', content: 'E o Miguel, de 14, que so responde por monossilabo?' },
  {
    role: 'assistant',
    content: 'Troque a pergunta direta por uma atividade lado a lado. Conversa de adolescente costuma vir de perfil, nao de frente.',
  },
];

/** Teto de leitura do seed: ele compara com o que existe, nao pagina de verdade. */
export const SEED_LIST_LIMIT = 100;
