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

export type ActivityMonthDigestParams = {
  readonly userId: string;
  /** `YYYY-MM`. */
  readonly month: string;
};

export type ActivityRecentDigestParams = {
  readonly userId: string;
  readonly limit: number;
};

/**
 * So o que a IA usa: o titulo (o boletim cita a atividade pelo nome e as
 * sugestoes evitam repetir), categoria, conclusao e nota. Descricao e filho
 * continuam no banco.
 */
export type ActivityMonthDigestRow = {
  readonly title: string;
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
  listRecentDigest(params: ActivityRecentDigestParams): Promise<readonly ActivityMonthDigestRow[]>;
};
