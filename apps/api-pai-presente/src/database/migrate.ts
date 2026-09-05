/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { migrate } from 'drizzle-orm/bun-sql/migrator';

import { database } from './client';

// Migration versionada e o unico caminho fora do local descartavel
// (database.md — `drizzle-kit push` nao roda em CI, staging nem producao).
await migrate(database, { migrationsFolder: './drizzle' });
