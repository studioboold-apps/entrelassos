/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'bun:test';

/**
 * Le `envs/` de fora da app de proposito: quem quebra com porta repetida e o
 * processo da API, e o defeito nao esta no codigo dela — esta no arquivo de
 * ambiente. Nao e import entre apps; e um teste lendo configuracao do repo.
 */
const ENVIRONMENTS_DIRECTORY = join(import.meta.dir, '../../../../envs');
const ENVIRONMENT_NAMES = ['dev', 'test', 'test.e2e'] as const;

/** Porta padrao do servico: e a que TODO outro projeto da maquina tambem quer. */
const CONTESTED_PORTS = {
  POSTGRES_PORT: 5432,
  API_PORT: 3000,
  WEB_PORT: 5173,
} as const;

/** Cada URL composta e um segundo lugar onde a porta poderia divergir. */
const COMPOSED_URLS = {
  DATABASE_URL: 'POSTGRES_PORT',
  API_BASE_URL: 'API_PORT',
  WEB_BASE_URL: 'WEB_PORT',
  WEB_ORIGINS: 'WEB_PORT',
} as const;

type EnvironmentName = (typeof ENVIRONMENT_NAMES)[number];

function readRawEnvironment(name: EnvironmentName): ReadonlyMap<string, string> {
  const content = readFileSync(join(ENVIRONMENTS_DIRECTORY, `env.${name}`), 'utf8');
  const entries = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => {
      const separatorIndex = line.indexOf('=');
      return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)] as const;
    });

  return new Map(entries);
}

const RAW_ENVIRONMENTS = new Map(
  ENVIRONMENT_NAMES.map((name) => [name, readRawEnvironment(name)] as const),
);

function readPort(name: EnvironmentName, variable: string): number {
  return Number(RAW_ENVIRONMENTS.get(name)?.get(variable));
}

describe('portas dos ambientes', () => {
  test.each([...ENVIRONMENT_NAMES])('env.%s nao ocupa a porta padrao de ninguem', (name: EnvironmentName) => {
    for (const [variable, contested] of Object.entries(CONTESTED_PORTS)) {
      expect(readPort(name, variable)).not.toBe(contested);
    }
  });

  test.each(Object.keys(CONTESTED_PORTS))('%s e diferente em cada ambiente', (variable) => {
    const ports = ENVIRONMENT_NAMES.map((name) => readPort(name, variable));
    expect(new Set(ports).size).toBe(ports.length);
  });

  test('nenhuma porta se repete entre servicos do mesmo ambiente', () => {
    for (const name of ENVIRONMENT_NAMES) {
      const ports = Object.keys(CONTESTED_PORTS).map((variable) => readPort(name, variable));
      expect(new Set(ports).size).toBe(ports.length);
    }
  });
});

describe('a porta mora num lugar so', () => {
  /**
   * Numero escrito a mao dentro da URL e a segunda verdade que so diverge no
   * dia em que alguem move a porta — e ai metade do sistema segue no antigo.
   */
  test.each(Object.entries(COMPOSED_URLS))('%s deriva de %s', (urlVariable, portVariable) => {
    for (const name of ENVIRONMENT_NAMES) {
      const value = RAW_ENVIRONMENTS.get(name)?.get(urlVariable) ?? '';
      expect(value).toContain(`\${${portVariable}}`);
      expect(value).not.toMatch(/:\d+/);
    }
  });
});
