/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { ERROR_CODES } from '../shared/errors/codes';
import { ResourceNotFoundError } from '../shared/errors/shared.error';
import type { ChildRow } from './child.table';
import type {
  CreateChildParams,
  CreateChildUseCasesParams,
  FindChildParams,
  ListChildrenParams,
  ListChildrenResult,
  RemoveChildParams,
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
  remove(params: RemoveChildParams): Promise<void>;
};

export function createChildUseCases({ repository, childFiles }: CreateChildUseCasesParams): ChildUseCases {
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

    /**
     * Os BYTES saem antes da linha, e nao o contrario. A ordem decide qual
     * metade sobrevive a uma falha: linha sem byte aparece na listagem e pode
     * ser apagada de novo; byte sem linha e' inominavel para sempre, porque
     * quem sabe quais arquivos um filho tem e' o Postgres — o balde nao tem
     * `list()`.
     *
     * A varredura vem antes de saber se o filho existe, e isso e' de proposito:
     * ela e' escopada pelo `userId` de quem pediu, entao filho alheio varre o
     * proprio nada. Consultar antes so' acrescentaria uma ida ao banco para
     * chegar na mesma resposta.
     */
    async remove({ childId, userId, clientIp }) {
      await childFiles.purgeByChild({ childId, userId, clientIp });

      const wasRemoved = await repository.remove({ childId, userId });
      if (!wasRemoved) childNotFound();
    },
  };
}
