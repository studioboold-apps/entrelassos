/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { ChildOwnershipPort } from '../shared/child-ownership.interface';
import { ERROR_CODES } from '../shared/errors/codes';
import { ResourceNotFoundError, ResourceNotOwnedError } from '../shared/errors/shared.error';
import type {
  ActivityRepository,
  ActivityView,
  CreateActivityParams,
  FindActivityParams,
  ListActivitiesParams,
  ListActivitiesResult,
  UpdateActivityParams,
} from './types/activity.types';

function activityNotFound(): never {
  throw new ResourceNotFoundError(
    ERROR_CODES.activity.ACTIVITY_NOT_FOUND,
    'Atividade nao encontrada.',
  );
}

export type ActivityUseCases = {
  list(params: ListActivitiesParams): Promise<ListActivitiesResult>;
  getById(params: FindActivityParams): Promise<ActivityView>;
  create(params: CreateActivityParams): Promise<ActivityView>;
  update(params: UpdateActivityParams): Promise<ActivityView>;
  remove(params: FindActivityParams): Promise<void>;
};

export type CreateActivityUseCasesParams = {
  readonly repository: ActivityRepository;
  readonly childOwnership: ChildOwnershipPort;
};

export function createActivityUseCases({
  repository,
  childOwnership,
}: CreateActivityUseCasesParams): ActivityUseCases {
  /** Sem isto, um id de filho alheio entraria numa atividade propria (BOLA). */
  async function assertChildIsOwned(childId: string | undefined, userId: string): Promise<void> {
    if (childId === undefined) return;
    const isOwned = await childOwnership.isOwnedByUser({ childId, userId });
    if (isOwned) return;
    throw new ResourceNotOwnedError(
      ERROR_CODES.activity.ACTIVITY_CHILD_NOT_OWNED,
      'O filho informado nao pertence a este usuario.',
    );
  }

  return {
    list: (params) => repository.list(params),

    async getById(params) {
      const activity = await repository.findById(params);
      return activity ?? activityNotFound();
    },

    async create({ userId, values }) {
      await assertChildIsOwned(values.childId, userId);
      return repository.insert({ ...values, userId });
    },

    async update(params) {
      await assertChildIsOwned(params.values.childId, params.userId);
      const activity = await repository.update(params);
      return activity ?? activityNotFound();
    },

    async remove(params) {
      const wasRemoved = await repository.remove(params);
      if (!wasRemoved) activityNotFound();
    },
  };
}
