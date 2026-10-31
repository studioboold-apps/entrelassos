/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, test } from 'bun:test';

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = readFileSync(join(HERE, 'AuthContext.jsx'), 'utf8');

/** O corpo de uma funcao do provider, do nome ate o `[` das dependencias. */
function bodyOf(name) {
  const start = SOURCE.indexOf(`const ${name} = useCallback(`);
  const end = SOURCE.indexOf('\n  );', start);
  return SOURCE.slice(start, end);
}

describe('troca de conta limpa o cache das telas', () => {
  test.each(['signIn', 'register', 'logout'])('%s descarta o cache do react-query', (name) => {
    expect(SOURCE.indexOf(`const ${name} = useCallback(`)).toBeGreaterThan(-1);
    expect(bodyOf(name)).toContain('forgetSessionQueries()');
  });
});
