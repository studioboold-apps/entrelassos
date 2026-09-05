/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { afterEach, describe, expect, test } from 'bun:test';

import { createLogger } from './logger';

type CapturedLine = Record<string, unknown>;

const originalWrite = process.stdout.write.bind(process.stdout);

function capture(emit: () => void): readonly CapturedLine[] {
  const lines: CapturedLine[] = [];
  process.stdout.write = ((chunk: string): boolean => {
    lines.push(JSON.parse(chunk) as CapturedLine);
    return true;
  }) as typeof process.stdout.write;
  try {
    emit();
  } finally {
    process.stdout.write = originalWrite;
  }
  return lines;
}

afterEach(() => {
  process.stdout.write = originalWrite;
});

describe('a linha segue a mascara do code-standart.md §11', () => {
  test('a linha traz todos os campos da mascara, na ordem dela', () => {
    const [line] = capture(() =>
      createLogger({ traceId: 'trace-1', source: 'router' }).info('rota atendida'),
    );

    expect(Object.keys(line ?? {})).toEqual([
      'traceId',
      'timestamp',
      'appName',
      'traceStack',
      'source',
      'lib',
      'level',
      'message',
      'meta',
    ]);
  });

  test('a linha e JSON de uma linha so, para o coletor nao remontar nada', () => {
    let raw = '';
    process.stdout.write = ((chunk: string): boolean => {
      raw = chunk;
      return true;
    }) as typeof process.stdout.write;
    createLogger({ traceId: 'trace-1', source: 'router' }).info('rota atendida');
    process.stdout.write = originalWrite;

    expect(raw.endsWith('\n')).toBe(true);
    expect(raw.trimEnd()).not.toContain('\n');
  });

  /**
   * O escopo empilha: `router > insights > provedor` conta ONDE a chamada estava
   * quando falhou. Sem a pilha, "provedor de IA recusou" nao diz de que rota.
   */
  test('o escopo empilha em vez de substituir a origem', () => {
    const logger = createLogger({ traceId: 'trace-1', source: 'router' });
    const [line] = capture(() => logger.withScope('insights').withScope('provedor').error('recusou'));

    expect(line?.traceStack).toEqual(['insights', 'provedor']);
    expect(line?.source).toBe('router');
  });

  test('o traceId atravessa o escopo — e por ele que se junta a linha do erro a da rota', () => {
    const logger = createLogger({ traceId: 'trace-42', source: 'router' });
    const lines = capture(() => {
      logger.info('entrou');
      logger.withScope('insights').error('saiu quebrado');
    });

    expect(lines.map((line) => line.traceId)).toEqual(['trace-42', 'trace-42']);
  });
});

describe('nenhum dado de crianca sai no log, em nivel nenhum (security.md §1)', () => {
  /** Este produto tem nome de crianca em quase toda tabela. */
  test('o nome da crianca nao sai, nem em camelCase nem em snake_case', () => {
    const [line] = capture(() =>
      createLogger({ traceId: 't', source: 'children' }).info('filho criado', {
        childName: 'Joaquim',
        full_name: 'Joaquim Alves',
        birthDate: '2018-04-11',
      }),
    );

    expect(JSON.stringify(line)).not.toContain('Joaquim');
    expect(JSON.stringify(line)).not.toContain('2018-04-11');
  });

  test('o debug redige igual ao error — nao ha nivel de confianca', () => {
    const [line] = capture(() =>
      createLogger({ traceId: 't', source: 'children' }).debug('rascunho', { email: 'pai@casa.br' }),
    );

    expect(JSON.stringify(line)).not.toContain('pai@casa.br');
  });

  test('a redacao desce em objeto aninhado', () => {
    const [line] = capture(() =>
      createLogger({ traceId: 't', source: 'children' }).warn('payload', {
        child: { name: 'Ana', id: 'c-1' },
      }),
    );

    expect(JSON.stringify(line)).not.toContain('Ana');
    expect(JSON.stringify(line)).toContain('c-1');
  });

  test('a redacao desce em lista, que era por onde o lote escapava', () => {
    const [line] = capture(() =>
      createLogger({ traceId: 't', source: 'children' }).info('lote', {
        children: [{ name: 'Ana' }, { name: 'Bento' }],
      }),
    );

    expect(JSON.stringify(line)).not.toContain('Ana');
    expect(JSON.stringify(line)).not.toContain('Bento');
  });

  /**
   * Defesa em profundidade: a chave certa e' a primeira linha, mas quem escreve
   * o log erra o nome dela. O VALOR tambem e' varrido.
   */
  test('e-mail em campo de nome inocente tambem e mascarado', () => {
    const [line] = capture(() =>
      createLogger({ traceId: 't', source: 'auth' }).error('falhou', {
        cause: 'usuario pai@casa.br ja existe',
      }),
    );

    expect(JSON.stringify(line)).not.toContain('pai@casa.br');
  });

  test('CPF e telefone em texto corrido tambem sao mascarados', () => {
    const [line] = capture(() =>
      createLogger({ traceId: 't', source: 'auth' }).error('falhou', {
        cause: 'documento 123.456.789-09 do telefone (11) 98765-4321',
      }),
    );

    const written = JSON.stringify(line);
    expect(written).not.toContain('123.456.789-09');
    expect(written).not.toContain('98765-4321');
  });

  test('a mensagem tambem passa pela redacao — nao so o meta', () => {
    const [line] = capture(() =>
      createLogger({ traceId: 't', source: 'auth' }).error('login de pai@casa.br recusado'),
    );

    expect(line?.message).not.toContain('pai@casa.br');
  });

  test('identificador opaco continua legivel, senao nao ha o que rastrear', () => {
    const [line] = capture(() =>
      createLogger({ traceId: 't', source: 'children' }).info('ok', {
        childId: 'c-9',
        userId: 'u-3',
        status: 201,
      }),
    );

    expect(line?.meta).toEqual({ childId: 'c-9', userId: 'u-3', status: 201 });
  });
});
