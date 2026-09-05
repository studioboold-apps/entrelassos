/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { drizzle } from 'drizzle-orm/bun-sql';

import { environment } from '../config/environment';
import * as schema from './schema';

export const database = drizzle(environment.DATABASE_URL, {
  schema,
  casing: 'snake_case',
});

export type Database = typeof database;
