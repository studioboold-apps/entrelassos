/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { HTTP_METHODS } from '../shared/http/http.constant';
import type { RateLimiter } from '../shared/http/rate-limit';
import { parseJsonBody } from '../shared/http/request.util';
import { respondWithData } from '../shared/http/response.util';
import type { RouteDefinition } from '../shared/http/route.types';
import {
  ACTIVITY_SUGGESTIONS_PATH,
  CHAT_PATH,
  INSIGHTS_PATH,
  REPORT_PATH,
} from './ai.constant';
import {
  chatBodySchema,
  generateInsightsBodySchema,
  generateReportBodySchema,
  generateSuggestionsBodySchema,
} from './ai.schema';
import type { AiUseCases } from './ai.use-case';

export type BuildAiRoutesParams = {
  readonly useCases: AiUseCases;
  readonly rateLimiter: RateLimiter;
};

/**
 * Toda rota daqui gasta dinheiro com terceiro, entao o teto vem ANTES do corpo
 * ser lido: conta invadida sem teto gasta sozinha (security.md §3). A chave e o
 * usuario autenticado, nunca o IP — um predio inteiro sai do mesmo IP.
 */
export function buildAiRoutes({ useCases, rateLimiter }: BuildAiRoutesParams): readonly RouteDefinition[] {
  return [
    {
      method: HTTP_METHODS.POST,
      path: INSIGHTS_PATH,
      summary: 'Gera insights de paternidade para os filhos do usuario.',
      handle: async ({ request, authenticatedUser }) => {
        rateLimiter.consume(authenticatedUser.userId);
        const values = await parseJsonBody(request, generateInsightsBodySchema);
        const insights = await useCases.generateInsights({
          userId: authenticatedUser.userId,
          values,
        });
        return respondWithData({ insights });
      },
    },
    {
      method: HTTP_METHODS.POST,
      path: ACTIVITY_SUGGESTIONS_PATH,
      summary: 'Sugere atividades para o pai fazer com os filhos no mes.',
      handle: async ({ request, authenticatedUser }) => {
        rateLimiter.consume(authenticatedUser.userId);
        const values = await parseJsonBody(request, generateSuggestionsBodySchema);
        const suggestions = await useCases.suggestActivities({
          userId: authenticatedUser.userId,
          values,
        });
        return respondWithData({ suggestions });
      },
    },
    {
      method: HTTP_METHODS.POST,
      path: REPORT_PATH,
      summary: 'Monta o boletim do mes a partir dos numeros medidos pelo servidor.',
      handle: async ({ request, authenticatedUser }) => {
        rateLimiter.consume(authenticatedUser.userId);
        const values = await parseJsonBody(request, generateReportBodySchema);
        const report = await useCases.generateReport({ userId: authenticatedUser.userId, values });
        return respondWithData(report);
      },
    },
    {
      method: HTTP_METHODS.POST,
      path: CHAT_PATH,
      summary: 'Responde a pergunta do pai como mentor de paternidade.',
      handle: async ({ request, authenticatedUser }) => {
        rateLimiter.consume(authenticatedUser.userId);
        const values = await parseJsonBody(request, chatBodySchema);
        const answer = await useCases.chat({ userId: authenticatedUser.userId, values });
        return respondWithData(answer);
      },
    },
  ];
}
