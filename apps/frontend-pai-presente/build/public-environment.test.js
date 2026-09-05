/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * O identificador do Google atravessa QUATRO arquivos ate chegar ao navegador:
 * declarado no IaC, passado como `--build-arg` pelo Railway, promovido a `ENV`
 * no `Dockerfile`, e assado no bundle pelo `define` do `vite.config.js`. Se um
 * elo cair, nada quebra: o Vite assa string vazia, o build passa, o deploy sobe
 * verde e a tela de entrada fica sem botao. Falha silenciosa de ponta a ponta.
 *
 * Em 05/09/2026 eu SUSPEITEI que o elo do `Dockerfile` estava quebrado (falta do
 * prefixo `VITE_`) e fui consertar. Um `grep` no bundle publicado mostrou
 * `Sz="AGUARDANDO-D7"` — a corrente estava inteira, e o conserto teria sido em
 * cima de nada. Este teste existe para que a proxima pergunta dessas seja
 * respondida por `bun test`, e nao por um deploy.
 */
const FRONTEND = join(import.meta.dir, '..');
const VITE_CONFIG = readFileSync(join(FRONTEND, 'vite.config.js'), 'utf8');
const DOCKERFILE = readFileSync(join(FRONTEND, 'Dockerfile'), 'utf8');
const RAILWAY = readFileSync(join(FRONTEND, '../../.railway/railway.ts'), 'utf8');

/** Le a lista do proprio `vite.config.js`: duas listas divergiriam na primeira edicao. */
function readPublicNames() {
  const declaration = VITE_CONFIG.match(/const PUBLIC_ENVIRONMENT_NAMES = \[([^\]]*)\]/);
  if (declaration === null) throw new Error('PUBLIC_ENVIRONMENT_NAMES nao encontrado');
  return [...declaration[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
}

const PUBLIC_NAMES = readPublicNames();
const SECRET_WORDS = ['SECRET', 'KEY', 'TOKEN', 'PASSWORD', 'DATABASE_URL'];

describe('a variavel publica chega ao bundle', () => {
  test('a lista nao esta vazia', () => {
    expect(PUBLIC_NAMES.length).toBeGreaterThan(0);
  });

  test.each(PUBLIC_NAMES)('%s tem ARG no Dockerfile', (name) => {
    expect(DOCKERFILE).toContain(`ARG ${name}`);
  });

  /** `ARG` sozinho morre no fim da instrucao: sem `ENV` o Vite nao le. */
  test.each(PUBLIC_NAMES)('%s vira ENV antes do build', (name) => {
    expect(DOCKERFILE).toContain(`${name}=\${${name}}`);
  });

  test('o build acontece depois do ENV, nunca antes', () => {
    const lastEnv = Math.max(...PUBLIC_NAMES.map((name) => DOCKERFILE.indexOf(`${name}=\${${name}}`)));
    expect(lastEnv).toBeLessThan(DOCKERFILE.indexOf('RUN bun run build'));
  });
});

describe('o nome e publico, e so o nome sem prefixo', () => {
  /**
   * O prefixo `VITE_` vive no `define`, nunca no nome da variavel: repeti-lo no
   * env criaria duas verdades que so divergem no dia da rotacao.
   */
  test.each(PUBLIC_NAMES)('%s nao carrega o prefixo VITE_', (name) => {
    expect(name.startsWith('VITE_')).toBe(false);
  });

  /** `security.md` §4: `--build-arg` fica gravado na camada da imagem. */
  test.each(PUBLIC_NAMES)('%s nao parece segredo', (name) => {
    expect(SECRET_WORDS.some((word) => name.includes(word))).toBe(false);
  });
});

describe('o que o navegador le esta declarado na producao', () => {
  /**
   * `VITE_API_BASE_URL` fica de fora de proposito: ela e vazia em producao,
   * porque a web repassa `/v1` pela rede privada.
   */
  const bridged = PUBLIC_NAMES.filter((name) =>
    readFileSync(join(FRONTEND, 'src/lib/use-sign-in.js'), 'utf8').includes(`VITE_${name}`),
  );

  test('o identificador do Google e um deles', () => {
    expect(bridged).toContain('GOOGLE_CLIENT_ID');
  });

  test('o servico web declara GOOGLE_CLIENT_ID e APP_ENV no IaC', () => {
    expect(RAILWAY).toContain('GOOGLE_CLIENT_ID:');
    expect(RAILWAY).toContain('APP_ENV:');
  });
});
