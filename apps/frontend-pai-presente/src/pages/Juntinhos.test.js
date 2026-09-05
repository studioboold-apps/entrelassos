/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * A tela nao e importada: puxar a pagina traria React, Tailwind e o roteador
 * para dentro do teste. O que se afirma aqui e a LIGACAO — que Juntinhos chama
 * quem ja tem regra e teste proprios (`calendar-date`, `describeApiFailure`).
 */
const SOURCE = readFileSync(join(import.meta.dir, 'Juntinhos.jsx'), 'utf8');

function countOccurrences(text, needle) {
  return text.split(needle).length - 1;
}

describe('o dia da atividade e dia de calendario, nao instante', () => {
  test('nenhum `new Date` cru sobre o campo de data', () => {
    expect(SOURCE).not.toContain('new Date(a.date)');
  });

  test('o dia passa pelo modulo que ja tem teste de fuso', () => {
    expect(SOURCE).toContain('toLocalDate');
  });
});

describe('a recusa da API chega ao pai', () => {
  test('a sugestao que falha nao morre no console', () => {
    expect(SOURCE).not.toContain('console.error');
  });

  test('a falha vira frase pelo tradutor unico', () => {
    expect(SOURCE).toContain('describeApiFailure');
  });

  test('a falha aparece como aviso na tela', () => {
    expect(SOURCE).toContain('role="alert"');
  });

  /**
   * Tres caminhos escrevem ou pedem: sugerir, criar e atualizar. Cada um tem de
   * ter a sua frase e o seu aviso, no lugar onde a acao aconteceu — um aviso so,
   * escondido atras de um dialogo fechado, e o mesmo silencio de antes.
   */
  test('os tres caminhos de escrita descrevem a recusa', () => {
    expect(countOccurrences(SOURCE, 'describeApiFailure(')).toBeGreaterThanOrEqual(3);
    expect(countOccurrences(SOURCE, 'role="alert"')).toBeGreaterThanOrEqual(3);
  });
});

describe('dado de servidor nao mora em useState', () => {
  test('a sugestao da IA e estado de servidor, e sai de uma mutation', () => {
    expect(SOURCE).not.toContain('setSuggestions');
    expect(SOURCE).not.toContain('setLoadingSuggestions');
  });
});
