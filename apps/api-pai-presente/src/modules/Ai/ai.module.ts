/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { ActivityRepository } from '../Activity/types/activity.types';
import type { ChildRepository } from '../Child/types/child.types';
import type { InsightRatingRepository } from '../InsightRating/types/insight-rating.types';
import { createRateLimiter } from '../shared/http/rate-limit';
import type { RouteDefinition } from '../shared/http/route.types';
import { AI_RATE_LIMIT, type LlmProviderName } from './ai.constant';
import { buildAiRoutes } from './ai.controller';
import { createAiUseCases } from './ai.use-case';
import { createLlmProvider } from './providers/provider.factory';
import type {
  ActivityDigestPort,
  ChildrenContextPort,
  InsightDigestPort,
} from './types/ai.types';

export type BuildAiModuleParams = {
  readonly children: ChildRepository;
  readonly activities: ActivityRepository;
  readonly insights: InsightRatingRepository;
  readonly providerName: LlmProviderName;
  readonly apiKey: string;
  readonly model: string;
};

/**
 * O modulo de IA nao conhece tabela de ninguem: cada porta e uma leitura
 * estreita, adaptada aqui sobre o repositorio que ja existe.
 */
function adaptChildrenContext(repository: ChildRepository): ChildrenContextPort {
  return { listByUser: (userId) => repository.listContext(userId) };
}

function adaptActivityDigest(repository: ActivityRepository): ActivityDigestPort {
  return { listMonth: (params) => repository.listMonthDigest(params) };
}

function adaptInsightDigest(repository: InsightRatingRepository): InsightDigestPort {
  return { listMonth: (params) => repository.listMonthDigest(params) };
}

export function buildAiModule({
  children,
  activities,
  insights,
  providerName,
  apiKey,
  model,
}: BuildAiModuleParams): readonly RouteDefinition[] {
  const useCases = createAiUseCases({
    provider: createLlmProvider({ providerName, apiKey, model }),
    children: adaptChildrenContext(children),
    activities: adaptActivityDigest(activities),
    insights: adaptInsightDigest(insights),
  });

  // Um limitador por MODULO, nao por rota: as quatro rotas gastam da mesma
  // conta, entao o teto tambem e o mesmo.
  return buildAiRoutes({ useCases, rateLimiter: createRateLimiter(AI_RATE_LIMIT) });
}
