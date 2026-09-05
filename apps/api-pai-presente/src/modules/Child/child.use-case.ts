/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { ERROR_CODES } from '../shared/errors/codes';
import { ResourceNotFoundError } from '../shared/errors/shared.error';
import type { ChildRow } from './child.table';
import type {
  ChildRepository,
  CreateChildParams,
  FindChildParams,
  ListChildrenParams,
  ListChildrenResult,
  UpdateChildParams,
} from './types/child.types';

function childNotFound(): never {
  throw new ResourceNotFoundError(ERROR_CODES.child.CHILD_NOT_FOUND, 'Filho nao encontrado.');
}

export type ChildUseCases = {
  list(params: ListChildrenParams): Promise<ListChildrenResult>;
  getById(params: FindChildParams): Promise<ChildRow>;
  create(params: CreateChildParams): Promise<ChildRow>;
  update(params: UpdateChildParams): Promise<ChildRow>;
  remove(params: FindChildParams): Promise<void>;
};

export function createChildUseCases(repository: ChildRepository): ChildUseCases {
  return {
    list: (params) => repository.list(params),

    async getById(params) {
      const child = await repository.findById(params);
      return child ?? childNotFound();
    },

    create: ({ userId, values }) => repository.insert({ ...values, userId }),

    async update(params) {
      const child = await repository.update(params);
      return child ?? childNotFound();
    },

    async remove(params) {
      const wasRemoved = await repository.remove(params);
      if (!wasRemoved) childNotFound();
    },
  };
}
