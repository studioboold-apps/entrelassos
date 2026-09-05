/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { ActivityRow, NewActivityRow } from '../activity.table';
import type {
  CreateActivityBody,
  ListActivitiesQuery,
  UpdateActivityBody,
} from '../activity.schema';

/** childName sai do vinculo, nunca de coluna copiada (decisao de TB.4). */
export type ActivityView = ActivityRow & { readonly childName: string | undefined };

export type ListActivitiesParams = {
  readonly userId: string;
  readonly filters: ListActivitiesQuery;
  readonly limit: number;
  readonly offset: number;
};

export type ListActivitiesResult = {
  readonly items: readonly ActivityView[];
  readonly total: number;
};

export type FindActivityParams = {
  readonly activityId: string;
  readonly userId: string;
};

export type CreateActivityParams = {
  readonly userId: string;
  readonly values: CreateActivityBody;
};

export type UpdateActivityParams = {
  readonly activityId: string;
  readonly userId: string;
  readonly values: UpdateActivityBody;
};

export type ChildOwnershipPort = {
  isOwnedByUser(params: { readonly childId: string; readonly userId: string }): Promise<boolean>;
};

export type ActivityMonthDigestParams = {
  readonly userId: string;
  /** `YYYY-MM`. */
  readonly month: string;
};

/** So o que o boletim conta — nem titulo nem descricao saem do banco a toa. */
export type ActivityMonthDigestRow = {
  readonly category: string | null;
  readonly isCompleted: boolean;
  readonly rating: number | null;
};

export type ActivityRepository = {
  list(params: ListActivitiesParams): Promise<ListActivitiesResult>;
  findById(params: FindActivityParams): Promise<ActivityView | undefined>;
  insert(row: NewActivityRow): Promise<ActivityView>;
  update(params: UpdateActivityParams): Promise<ActivityView | undefined>;
  remove(params: FindActivityParams): Promise<boolean>;
  listMonthDigest(params: ActivityMonthDigestParams): Promise<readonly ActivityMonthDigestRow[]>;
};
