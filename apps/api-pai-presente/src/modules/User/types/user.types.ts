/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { UpdateUserBody } from '../user.schema';
import type { UserRow } from '../user.table';

export type FindUserParams = { readonly userId: string };

export type UpdateUserParams = {
  readonly userId: string;
  readonly values: UpdateUserBody;
};

export type EnsureUserParams = {
  readonly userId: string;
  readonly email: string;
};

export type UserRepository = {
  findById(params: FindUserParams): Promise<UserRow | undefined>;
  update(params: UpdateUserParams): Promise<UserRow | undefined>;
};
