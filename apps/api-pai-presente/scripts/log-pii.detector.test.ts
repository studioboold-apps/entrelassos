/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { PLANTED_CANARIES, findPiiInLog } from './log-pii.detector';

/**
 * Controle positivo da varredura. Sem estes testes, `make log-pii-audit`
 * passaria igualzinho com o detector quebrado — e "nenhum achado" viraria
 * carimbo de aprovacao em vez de medicao.
 */
describe('o detector enxerga o que ele promete enxergar', () => {
  for (const [label, value] of Object.entries(PLANTED_CANARIES)) {
    test(`acha a isca ${label} no meio de uma linha de JSON`, () => {
      const line = `{"level":"error","message":"falhou","meta":{"cause":"${value} recusado"}}`;
      expect(findPiiInLog(line).length).toBeGreaterThan(0);
    });
  }

  /** O que nao foi plantado tambem tem de cair: PII de terceiro nao avisa. */
  test('acha e-mail, CPF e telefone que ninguem plantou', () => {
    const log = [
      '{"message":"outro@dominio.com.br"}',
      '{"message":"111.444.777-35"}',
      '{"message":"21999887766"}',
    ].join('\n');
    expect(findPiiInLog(log)).toHaveLength(3);
  });
});

describe('o detector nao acusa o que e log legitimo', () => {
  test('identificador opaco e a forma certa de rastrear, e passa', () => {
    const line =
      '{"traceId":"3f1c7a9e-8b2d-4f6a-9c1e-5d7b0a2c4e6f","message":"api no ar","meta":{"port":3400}}';
    expect(findPiiInLog(line)).toHaveLength(0);
  });

  test('o valor ja mascarado pelo logger passa', () => {
    expect(findPiiInLog('{"meta":{"email":"[REDACTED]"}}')).toHaveLength(0);
  });
});
