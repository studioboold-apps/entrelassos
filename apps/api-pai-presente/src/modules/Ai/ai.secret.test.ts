/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, expect, test } from 'bun:test';

const REPOSITORY_ROOT = resolve(import.meta.dir, '../../../../..');
const FRONTEND_SOURCE = join(REPOSITORY_ROOT, 'apps/frontend-pai-presente/src');
const ENVIRONMENT_DIRECTORY = join(REPOSITORY_ROOT, 'envs');

/** O que so pode existir do lado do servidor. */
const SERVER_ONLY_MARKERS = [
  'LLM_API_KEY',
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'api.anthropic.com',
  'api.openai.com',
] as const;

const PUBLIC_PREFIX = 'VITE_';
const SECRET_NAME_PATTERN = /KEY|SECRET|TOKEN|PASSWORD|LLM/i;

function listSourceFiles(directory: string): readonly string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listSourceFiles(path) : [path];
  });
}

function listEnvironmentNames(): readonly string[] {
  return readdirSync(ENVIRONMENT_DIRECTORY)
    .flatMap((file) => readFileSync(join(ENVIRONMENT_DIRECTORY, file), 'utf8').split('\n'))
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => line.split('=')[0] ?? '');
}

describe('fronteira do segredo do provedor de IA', () => {
  test('nenhum arquivo do frontend cita a chave nem o endereco do provedor', () => {
    const offenders = listSourceFiles(FRONTEND_SOURCE).filter((path) => {
      const content = readFileSync(path, 'utf8');
      return SERVER_ONLY_MARKERS.some((marker) => content.includes(marker));
    });

    expect(offenders).toEqual([]);
  });

  test('nada com cara de segredo carrega o prefixo publico do Vite', () => {
    // O Vite inlina o literal de tudo que comeca com `VITE_` no bundle: o
    // prefixo e a propria publicacao do valor.
    const published = listEnvironmentNames().filter(
      (name) => name.startsWith(PUBLIC_PREFIX) && SECRET_NAME_PATTERN.test(name),
    );

    expect(published).toEqual([]);
  });

  test('a chave e exigida no boot do SERVIDOR, e so la', () => {
    const environmentSchema = readFileSync(
      join(import.meta.dir, '../../config/environment.ts'),
      'utf8',
    );

    expect(environmentSchema).toContain('LLM_API_KEY');
    expect(environmentSchema).not.toContain(`${PUBLIC_PREFIX}LLM`);
  });
});
