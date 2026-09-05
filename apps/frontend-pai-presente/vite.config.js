/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const API_PREFIX = '/v1';

/**
 * O `make` exporta o env do ambiente antes de chamar o Vite. Sem ele o proxy
 * apontaria para lugar nenhum e toda chamada voltaria 404 do proprio Vite —
 * falha que parece bug da API. Melhor nao subir.
 */
function requireEnvironment(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} nao definido — suba o frontend por 'make dev-web'.`);
  }
  return value;
}

/**
 * O identificador de cliente e o MESMO que a API usa para conferir o token, e
 * ele nao e segredo (`security.md` §4). Repeti-lo como `VITE_GOOGLE_CLIENT_ID`
 * no arquivo de env criaria duas verdades que so divergem no dia da rotacao —
 * o botao passaria a assinar com um id que a API nao aceita. Le-se um so, e o
 * prefixo `VITE_` fica no codigo dizendo "isto vai para o navegador".
 */
const PUBLIC_CLIENT_IDS = ['GOOGLE_CLIENT_ID', 'APPLE_CLIENT_ID'];

function definePublicClientIds() {
  return Object.fromEntries(
    PUBLIC_CLIENT_IDS.map((name) => [
      `import.meta.env.VITE_${name}`,
      JSON.stringify(process.env[name] ?? ''),
    ]),
  );
}

export default defineConfig(({ command }) => ({
  plugins: [react()],
  define: definePublicClientIds(),
  /** O `@/` vinha do plugin deles; sem esta linha nenhum import resolve. */
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  /**
   * Em desenvolvimento o navegador fala com o proprio Vite e ele repassa para a
   * API. Sem isso o cookie de sessao seria de outra origem, e `SameSite` o
   * descartaria — o pai entraria e continuaria deslogado.
   */
  server:
    command === 'serve'
      ? {
          port: Number(requireEnvironment('WEB_PORT')),
          proxy: { [API_PREFIX]: { target: requireEnvironment('API_BASE_URL'), changeOrigin: true } },
        }
      : undefined,
}));
