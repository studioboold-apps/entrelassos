/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { ChildRow, NewChildRow } from '../child.table';
import type { CreateChildBody, UpdateChildBody } from '../child.schema';

export type ListChildrenParams = {
  readonly userId: string;
  readonly limit: number;
  readonly offset: number;
};

export type ListChildrenResult = {
  readonly items: readonly ChildRow[];
  readonly total: number;
};

export type FindChildParams = {
  readonly childId: string;
  readonly userId: string;
};

export type UpdateChildParams = {
  readonly childId: string;
  readonly userId: string;
  readonly values: UpdateChildBody;
};

export type CreateChildParams = {
  readonly userId: string;
  readonly values: CreateChildBody;
};

export type ChildRepository = {
  list(params: ListChildrenParams): Promise<ListChildrenResult>;
  findById(params: FindChildParams): Promise<ChildRow | undefined>;
  insert(row: NewChildRow): Promise<ChildRow>;
  update(params: UpdateChildParams): Promise<ChildRow | undefined>;
  remove(params: FindChildParams): Promise<boolean>;
};
