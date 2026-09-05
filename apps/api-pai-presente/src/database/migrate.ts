/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { migrate } from 'drizzle-orm/bun-sql/migrator';

import { environment } from '../config/environment';
import { createDatabaseClient } from './client';

await migrate(createDatabaseClient(environment.DATABASE_URL), {
  migrationsFolder: './drizzle',
});
