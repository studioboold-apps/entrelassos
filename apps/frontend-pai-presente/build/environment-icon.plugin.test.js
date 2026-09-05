/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, test } from 'bun:test';

import { APP_ENVIRONMENTS } from '../src/lib/environment';
import {
  DEVELOPMENT_ICON,
  PRODUCTION_ICON,
  environmentIconPlugin,
  resolveEnvironmentIcon,
} from './environment-icon.plugin';

const PUBLIC_DIRECTORY = join(dirname(dirname(fileURLToPath(import.meta.url))), 'public');

function transform(environment) {
  return environmentIconPlugin({ environment }).transformIndexHtml(
    '<link rel="icon" type="%APP_ICON_TYPE%" href="%APP_ICON_HREF%" />',
  );
}

describe('resolveEnvironmentIcon', () => {
  test('producao usa o icone limpo', () => {
    expect(resolveEnvironmentIcon(APP_ENVIRONMENTS.PRODUCTION)).toEqual(PRODUCTION_ICON);
  });

  test.each([APP_ENVIRONMENTS.LOCAL, APP_ENVIRONMENTS.STAGING])(
    'fora de producao (%s) usa o icone com o aviso',
    (environment) => {
      expect(resolveEnvironmentIcon(environment)).toEqual(DEVELOPMENT_ICON);
    },
  );

  /** `web.md` §12: o contrato exige que o arquivo apontado EXISTA. */
  test.each([PRODUCTION_ICON, DEVELOPMENT_ICON])('o arquivo de $href existe', ({ href }) => {
    expect(existsSync(join(PUBLIC_DIRECTORY, href))).toBe(true);
  });
});

describe('environmentIconPlugin', () => {
  test('troca href e tipo no html', () => {
    expect(transform(APP_ENVIRONMENTS.PRODUCTION)).toBe(
      `<link rel="icon" type="${PRODUCTION_ICON.type}" href="${PRODUCTION_ICON.href}" />`,
    );
    expect(transform(APP_ENVIRONMENTS.LOCAL)).toBe(
      `<link rel="icon" type="${DEVELOPMENT_ICON.type}" href="${DEVELOPMENT_ICON.href}" />`,
    );
  });

  /**
   * Marcador que sobra vaza para a aba do cliente como caminho invalido, e o
   * navegador nao reclama: fica sem icone e ninguem descobre.
   */
  test('nao sobra marcador no html transformado', () => {
    expect(transform(APP_ENVIRONMENTS.PRODUCTION)).not.toContain('%APP_ICON');
  });
});
