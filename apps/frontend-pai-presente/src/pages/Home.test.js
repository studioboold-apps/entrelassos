/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * A tela nao e importada: puxar a pagina traria React, Tailwind e todo o
 * roteador para dentro do teste. O que se afirma aqui e a LIGACAO — que a Home
 * chama quem ja tem regra e teste proprios.
 */
const SOURCE = readFileSync(join(import.meta.dir, 'Home.jsx'), 'utf8');

describe('a nota que o pai da no insight', () => {
  test('a identidade do insight nao vem do relogio', () => {
    expect(SOURCE).not.toContain('Date.now()');
  });

  test('o id sai do conteudo, pela mesma funcao que a nota usa como chave', () => {
    expect(SOURCE).toContain('withStableIds');
  });

  test('a nota que falhou ao gravar nao fica acesa na tela', () => {
    expect(SOURCE).toContain('onError');
  });
});

describe('a recusa da API chega ao pai', () => {
  test('a falha de geracao passa por describeApiFailure', () => {
    expect(SOURCE).toContain('describeApiFailure');
  });

  test('a falha aparece como aviso, nao so no console', () => {
    expect(SOURCE).toContain('role="alert"');
    expect(SOURCE).not.toContain('console.error');
  });

  test('sem insight por falha, a tela nao diz que nao ha insight', () => {
    expect(SOURCE).toContain('insightsFailure');
  });
});

describe('dado de servidor nao passa por useEffect', () => {
  test('as notas salvas sao derivadas na renderizacao', () => {
    expect(SOURCE).not.toContain('setRatings');
  });
});
