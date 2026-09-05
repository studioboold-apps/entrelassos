/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { defineConfig } from 'drizzle-kit';

// DATABASE_URL vem do envs/env.$(ENV) carregado pelo Makefile; sem ele o
// drizzle-kit escolheria um banco por acidente em vez de falhar.
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL ausente — rode via `make`');

export default defineConfig({
  schema: './src/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: databaseUrl },
  casing: 'snake_case',
  strict: true,
  verbose: true,
});
