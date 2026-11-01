/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { APP_PUBLIC_URL, buildBoletimShareText } from './boletim-share';

const t = (key, args = {}) => `${key}${Object.values(args).length ? `(${Object.values(args).join('|')})` : ''}`;
const REPORT = {
  nota_geral: 4,
  pontos_fortes: [{ titulo: 'Presença' }, { titulo: 'Rotina' }],
  pontos_melhoria: [{ titulo: 'Paciência' }],
  meta_proximo_mes: 'Ler juntos 3x por semana',
};

describe('texto do boletim para compartilhar', () => {
  test('leva nota, pontos fortes, meta e o link do app', () => {
    const text = buildBoletimShareText({ report: REPORT, monthLabel: 'novembro', scoreLabel: 'Muito bom', t });
    expect(text).toContain('boletim.share.score(4|Muito bom)');
    expect(text).toContain('• Presença');
    expect(text).toContain('Ler juntos 3x por semana');
    expect(text).toContain(APP_PUBLIC_URL);
  });

  test('nao expoe os pontos de melhoria', () => {
    const text = buildBoletimShareText({ report: REPORT, monthLabel: 'novembro', scoreLabel: 'x', t });
    expect(text).not.toContain('Paciência');
  });

  test('na Comunidade vai sem link', () => {
    const text = buildBoletimShareText({ report: REPORT, monthLabel: 'n', scoreLabel: 'x', t, withLink: false });
    expect(text).not.toContain(APP_PUBLIC_URL);
  });
});
