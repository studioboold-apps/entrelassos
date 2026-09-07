/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'bun:test';

import {
  buildChatPrompt,
  buildInsightsPrompt,
  buildReportPrompt,
  buildSuggestionsPrompt,
} from './ai.prompt';
import { summarizeActivities, summarizeInsights } from './ai.summary';
import type { ChildContext } from './types/ai.types';

/**
 * `D2` — arquivo NUNCA vai para a IA. Nem os bytes, nem o nome, nem a legenda.
 * Mandar exame de crianca para a Anthropic seria transferencia de dado de saude
 * de menor para terceiro sem base legal (LGPD art. 11), e mandar a legenda da
 * foto e' o mesmo problema com menos bytes.
 *
 * O teste existe porque a tentacao tem nome: "dar contexto ao mentor". Ela chega
 * como melhoria, o mentor de fato responde melhor com o laudo na mao, e nenhum
 * teste de comportamento reprova isso. Sem uma invariante, ela passa em silencio.
 *
 * Medido hoje: zero ocorrencias em `src/modules/AI`. Isto e' guarda, nao conserto.
 */
const AI_DIRECTORY = import.meta.dir;

/** Os nomes por onde o arquivo do filho entraria neste modulo. */
const FILE_MARKERS = [
  'ChildFile',
  'child-file',
  'MediaStorage',
  'media-storage',
  'media-cipher',
  'objectKey',
  'contentPath',
  'byteSize',
  'isEncrypted',
] as const;

function listSourceFiles(directory: string): readonly string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listSourceFiles(path);
    return entry.name.endsWith('.test.ts') ? [] : [path];
  });
}

/**
 * Um filho com campo de arquivo pendurado, do jeito que ele apareceria de
 * verdade: alguem amplia a leitura estreita do `Child` e o campo passa a viajar
 * dentro do contexto sem ninguem reparar. A assercao e' sobre o PROMPT, entao
 * ela reprova o vazamento independentemente de onde o campo nasceu.
 */
const CHILD_WITH_FILE_FIELDS = {
  name: 'Joao',
  age: 7,
  gender: 'menino',
  caption: 'raio-x do braco esquerdo',
  objectKey: 'children/abc/def',
  contentPath: '/v1/children/abc/files/def/content',
} as ChildContext;

const CHILDREN = [CHILD_WITH_FILE_FIELDS];
const LEAKED_VALUES = ['raio-x', 'children/abc/def', 'files/def'] as const;

const PROMPTS: readonly (readonly [string, string])[] = [
  ['insights', buildInsightsPrompt({ children: CHILDREN, category: undefined })],
  ['sugestoes', buildSuggestionsPrompt({ children: CHILDREN, month: '2026-09' })],
  [
    'boletim',
    buildReportPrompt({
      children: CHILDREN,
      month: '2026-09',
      activities: summarizeActivities([]),
      insights: summarizeInsights([]),
    }),
  ],
  ['conversa', buildChatPrompt({ children: CHILDREN, message: 'como ajudo na escola?' })],
];

describe('D2 — nenhum prompt carrega arquivo de filho', () => {
  /**
   * As QUATRO rotas, e nao a mais obvia: quem quiser dar o exame ao mentor mexe
   * na conversa, mas quem quiser "enriquecer o boletim" mexe no boletim.
   */
  for (const [name, prompt] of PROMPTS) {
    test(`o prompt de ${name} descreve o filho por nome, idade e genero — e nada mais`, () => {
      for (const leaked of LEAKED_VALUES) {
        expect(prompt).not.toContain(leaked);
      }
      expect(prompt).toContain('Joao, 7 anos, menino');
    });
  }
});

describe('D2 — o modulo de IA nao alcanca o balde', () => {
  /**
   * A fronteira e' de IMPORT, e nao so' de texto do prompt: enquanto `AI/` nao
   * conhece o modulo dos arquivos, o balde nem a cifra, nao existe de onde tirar
   * o conteudo para mandar. E' a metade da invariante que reprova a melhoria
   * ANTES de ela chegar ao prompt.
   */
  test('nenhum arquivo de AI cita o modulo dos arquivos, o balde ou a cifra', () => {
    const offenders = listSourceFiles(AI_DIRECTORY).flatMap((path) => {
      const content = readFileSync(path, 'utf8');
      const found = FILE_MARKERS.filter((marker) => content.includes(marker));
      return found.length === 0 ? [] : [`${path}: ${found.join(', ')}`];
    });

    expect(offenders).toEqual([]);
  });
});
