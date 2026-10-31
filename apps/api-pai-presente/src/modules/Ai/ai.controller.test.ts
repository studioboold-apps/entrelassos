/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import {
  createTestClient,
  readDataRecord,
  readErrorCode,
  type TestClient,
} from '../../testing/http-test.util';
import { ERROR_CODES } from '../shared/errors/codes';
import { HTTP_METHODS, HTTP_STATUS } from '../shared/http/http.constant';
import { createRateLimiter, type RateLimitPolicy } from '../shared/http/rate-limit';
import {
  ACTIVITY_SUGGESTIONS_PATH,
  AI_RATE_LIMIT,
  CHAT_PATH,
  INSIGHTS_PATH,
  REPORT_PATH,
} from './ai.constant';
import { buildAiRoutes } from './ai.controller';
import { createLlmProvider } from './providers/provider.factory';
import { createAiUseCases } from './ai.use-case';
import type {
  ActivityDigestRow,
  ChildContext,
  InsightDigestRow,
  LlmProvider,
  LlmStructuredRequest,
  LlmTextRequest,
} from './types/ai.types';

const CHILD: ChildContext = { name: 'Bento', age: 7, gender: 'masculino' };
const MONTH = '2026-08';

type FakeProvider = LlmProvider & { readonly prompts: string[]; readonly systemPrompts: string[] };

function createFakeProvider(structured: unknown, text = 'Uma resposta do mentor.'): FakeProvider {
  const prompts: string[] = [];
  const systemPrompts: string[] = [];
  return {
    name: 'anthropic',
    prompts,
    systemPrompts,
    async generateText({ userPrompt, systemPrompt }: LlmTextRequest): Promise<string> {
      prompts.push(userPrompt);
      systemPrompts.push(systemPrompt);
      return text;
    },
    async generateStructured({ userPrompt, systemPrompt }: LlmStructuredRequest): Promise<unknown> {
      prompts.push(userPrompt);
      systemPrompts.push(systemPrompt);
      return structured;
    },
  };
}

type HarnessParams = {
  readonly provider: FakeProvider;
  readonly children?: readonly ChildContext[];
  readonly activities?: readonly ActivityDigestRow[];
  readonly insights?: readonly InsightDigestRow[];
  readonly policy?: RateLimitPolicy;
};

function createHarness({
  provider,
  children = [CHILD],
  activities = [],
  insights = [],
  policy = AI_RATE_LIMIT,
}: HarnessParams): TestClient {
  const useCases = createAiUseCases({
    provider,
    children: { listByUser: async () => children },
    activities: { listMonth: async () => activities },
    insights: { listMonth: async () => insights },
  });
  return createTestClient({
    routes: buildAiRoutes({ useCases, rateLimiter: createRateLimiter(policy) }),
  });
}

function buildInsightsPayload(): unknown {
  return {
    insights: [
      {
        title: 'Rotina de leitura',
        content: 'Leia dez minutos antes de dormir.',
        category: 'comportamento',
        childName: 'Bento',
      },
    ],
  };
}

function buildReportPayload(): unknown {
  return {
    grade: 7,
    strengths: [{ title: 'Presenca', description: 'Esteve junto nos fins de semana.' }],
    improvements: [{ title: 'Constancia', description: 'Faltou durante a semana.' }],
    motivationalMessage: 'Continue.',
    nextMonthGoal: 'Uma atividade por semana.',
  };
}

describe('rotas de IA', () => {
  test('insights voltam com id gerado pelo SERVIDOR', async () => {
    const provider = createFakeProvider(buildInsightsPayload());
    const client = createHarness({ provider });

    const response = await client.send({ method: HTTP_METHODS.POST, path: INSIGHTS_PATH, body: {} });

    expect(response.status).toBe(200);
    const [insight] = readDataRecord(response).insights as readonly Record<string, unknown>[];
    expect(insight?.title).toBe('Rotina de leitura');
    expect(typeof insight?.id).toBe('string');
    expect((insight?.id as string).length).toBeGreaterThan(0);
  });

  test('sem filho cadastrado NAO chama o provedor — a chamada custa dinheiro', async () => {
    const provider = createFakeProvider(buildInsightsPayload());
    const client = createHarness({ provider, children: [] });

    const response = await client.send({ method: HTTP_METHODS.POST, path: INSIGHTS_PATH, body: {} });

    expect(response.status).toBe(422);
    expect(readErrorCode(response)).toBe(ERROR_CODES.ai.NO_CHILDREN);
    expect(provider.prompts).toHaveLength(0);
  });

  test('a conversa dispensa filho cadastrado — a primeira pergunta vem antes', async () => {
    const provider = createFakeProvider(undefined);
    const client = createHarness({ provider, children: [] });

    const response = await client.send({
      method: HTTP_METHODS.POST,
      path: CHAT_PATH,
      body: { message: 'Como lidar com birra?' },
    });

    expect(response.status).toBe(200);
    expect(readDataRecord(response).reply).toBe('Uma resposta do mentor.');
    expect(provider.prompts[0]).toContain('Como lidar com birra?');
  });

  test('o boletim usa os numeros do SERVIDOR, nao o que o cliente mandar', async () => {
    const provider = createFakeProvider(buildReportPayload());
    const client = createHarness({
      provider,
      activities: [
        { category: 'aventura', isCompleted: true, rating: 5 },
        { category: 'aventura', isCompleted: true, rating: 3 },
        { category: 'escolar', isCompleted: false, rating: null },
        { category: null, isCompleted: false, rating: null },
      ],
      insights: [{ category: 'comportamento', rating: 4 }],
    });

    const response = await client.send({
      method: HTTP_METHODS.POST,
      path: REPORT_PATH,
      // `completionRate` e `grade` sao ruido do cliente: o schema os descarta.
      body: { month: MONTH, completionRate: 100, grade: 10 },
    });

    expect(response.status).toBe(200);
    expect(readDataRecord(response).grade).toBe(7);
    expect(provider.prompts[0]).toContain('atividades planejadas: 4');
    expect(provider.prompts[0]).toContain('taxa de conclusao: 50%');
  });

  test('mes fora de YYYY-MM para na fronteira, antes de gastar a chamada', async () => {
    const provider = createFakeProvider(buildReportPayload());
    const client = createHarness({ provider });

    const response = await client.send({
      method: HTTP_METHODS.POST,
      path: REPORT_PATH,
      body: { month: 'agosto' },
    });

    expect(response.status).toBe(400);
    expect(provider.prompts).toHaveLength(0);
  });

  test('resposta fora do formato e culpa do PROVEDOR: 502, nao 400', async () => {
    const provider = createFakeProvider({ insights: [{ title: 'so o titulo' }] });
    const client = createHarness({ provider });

    const response = await client.send({ method: HTTP_METHODS.POST, path: INSIGHTS_PATH, body: {} });

    expect(response.status).toBe(502);
    expect(readErrorCode(response)).toBe(ERROR_CODES.ai.RESPONSE_INVALID);
  });

  test('estourar o teto devolve 429 COM Retry-After', async () => {
    const provider = createFakeProvider({ suggestions: [] });
    const client = createHarness({ provider, policy: { maxRequests: 2, windowSeconds: 60 } });
    const send = () =>
      client.send({ method: HTTP_METHODS.POST, path: ACTIVITY_SUGGESTIONS_PATH, body: {} });

    expect((await send()).status).toBe(200);
    expect((await send()).status).toBe(200);
    const blocked = await send();

    expect(blocked.status).toBe(429);
    expect(readErrorCode(blocked)).toBe(ERROR_CODES.shared.TOO_MANY_REQUESTS);
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0);
  });

  test('o teto e por USUARIO: as quatro rotas dividem a mesma cota', async () => {
    const provider = createFakeProvider(buildInsightsPayload());
    const client = createHarness({ provider, policy: { maxRequests: 1, windowSeconds: 60 } });

    expect(
      (await client.send({ method: HTTP_METHODS.POST, path: INSIGHTS_PATH, body: {} })).status,
    ).toBe(200);
    expect(
      (await client.send({ method: HTTP_METHODS.POST, path: CHAT_PATH, body: { message: 'oi' } }))
        .status,
    ).toBe(429);
  });
});

/**
 * `F2.4` cobra a tela de chat provando o ERRO legivel quando nao ha chave de IA.
 * Isso so existe se o produto SUBIR sem ela — e foi o que faltava: em 05/09/2026
 * `make dev` levantou a web e matou a API com `ZodError: LLM_API_KEY`.
 */
describe('IA sem chave configurada', () => {
  function createUnconfiguredClient(): TestClient {
    const useCases = createAiUseCases({
      provider: createLlmProvider({ providerName: 'anthropic', apiKey: '', model: '' }),
      children: { listByUser: async () => [CHILD] },
      activities: { listMonth: async () => [] },
      insights: { listMonth: async () => [] },
    });
    return createTestClient({
      routes: buildAiRoutes({ useCases, rateLimiter: createRateLimiter(AI_RATE_LIMIT) }),
    });
  }

  test.each([
    [CHAT_PATH, { message: 'oi' }],
    [INSIGHTS_PATH, {}],
    [ACTIVITY_SUGGESTIONS_PATH, {}],
    [REPORT_PATH, { month: MONTH }],
  ])('%s responde 503 com codigo estavel', async (path, body) => {
    const response = await createUnconfiguredClient().send({
      method: HTTP_METHODS.POST,
      path,
      body,
    });

    expect(response.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
    expect(readErrorCode(response)).toBe(ERROR_CODES.ai.NOT_CONFIGURED);
  });
});

/**
 * A resposta da IA tem de falar a lingua que o pai escolheu no app: um insight em
 * portugues no meio de uma tela em ingles e' texto que ele nao le.
 */
describe('a IA responde no idioma do app', () => {
  test('o chat em ingles pede resposta em ingles', async () => {
    const provider = createFakeProvider(undefined);
    const client = createHarness({ provider });

    const response = await client.send({
      method: HTTP_METHODS.POST,
      path: CHAT_PATH,
      body: { message: 'How do I handle tantrums?', locale: 'en' },
    });

    expect(response.status).toBe(200);
    expect(provider.systemPrompts[0]).toContain('Responda sempre em ingles');
  });

  test('os insights em espanhol pedem resposta em espanhol', async () => {
    const provider = createFakeProvider(buildInsightsPayload());
    const client = createHarness({ provider });

    const response = await client.send({
      method: HTTP_METHODS.POST,
      path: INSIGHTS_PATH,
      body: { locale: 'es' },
    });

    expect(response.status).toBe(200);
    expect(provider.systemPrompts[0]).toContain('Responda sempre em espanhol');
  });

  /** O app antigo nao manda o campo: continua recebendo resposta, em portugues. */
  test('sem idioma, portugues', async () => {
    const provider = createFakeProvider(undefined);
    const client = createHarness({ provider });

    const response = await client.send({
      method: HTTP_METHODS.POST,
      path: CHAT_PATH,
      body: { message: 'Oi' },
    });

    expect(response.status).toBe(200);
    expect(provider.systemPrompts[0]).toContain('Responda sempre em portugues do Brasil');
  });

  test('idioma desconhecido cai no portugues em vez de recusar', async () => {
    const provider = createFakeProvider(buildReportPayload());
    const client = createHarness({ provider });

    const response = await client.send({
      method: HTTP_METHODS.POST,
      path: REPORT_PATH,
      body: { month: MONTH, locale: 'fr' },
    });

    expect(response.status).toBe(200);
    expect(provider.systemPrompts[0]).toContain('Responda sempre em portugues do Brasil');
  });

  /** A categoria e' identificador do banco: traduzida, a resposta nao passa no schema. */
  test('o prompt manda manter a categoria como identificador', async () => {
    const provider = createFakeProvider(undefined);
    const client = createHarness({ provider });

    await client.send({ method: HTTP_METHODS.POST, path: CHAT_PATH, body: { message: 'Hi', locale: 'en' } });

    expect(provider.systemPrompts[0]).toContain('sem traduzir');
  });
});
