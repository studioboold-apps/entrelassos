/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, test } from 'bun:test';

const SOURCE_DIRECTORY = dirname(join(fileURLToPath(import.meta.url), '..'));
const CONSUMER_DIRECTORIES = ['pages', 'components'];

/**
 * O teste le o TEXTO em vez de importar: `client.js` puxa `import.meta.env`, e a
 * pergunta aqui nao e se a chamada funciona — e se alguem chama.
 */
const ENTITY_NAME_PATTERN = /^\s*([A-Z][A-Za-z]*),$/gm;

function readExposedEntityNames() {
  const source = readFileSync(join(SOURCE_DIRECTORY, 'api', 'client.js'), 'utf8');
  const block = source.slice(source.indexOf('entities: Object.freeze({'));
  return [...block.matchAll(ENTITY_NAME_PATTERN)].map(([, name]) => name);
}

function readConsumerSources() {
  return CONSUMER_DIRECTORIES.flatMap((directory) =>
    readdirSync(join(SOURCE_DIRECTORY, directory), { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => readFileSync(join(SOURCE_DIRECTORY, directory, entry.name), 'utf8')),
  ).join('\n');
}

describe('api.entities', () => {
  /**
   * `ChatMessage` existia no backend, com tabela e rota, e NENHUMA tela lia ou
   * escrevia nela: fechar o app perdia a conversa (GOAL §4.2). Entidade orfa
   * passa em todo teste de contrato, porque o contrato esta certo — o que falta
   * e alguem do outro lado.
   */
  test('toda entidade exposta e usada por alguma tela', () => {
    const consumers = readConsumerSources();
    const entityNames = readExposedEntityNames();

    expect(entityNames.length).toBeGreaterThan(0);
    expect(entityNames.filter((name) => !consumers.includes(`entities.${name}`))).toEqual([]);
  });
});
