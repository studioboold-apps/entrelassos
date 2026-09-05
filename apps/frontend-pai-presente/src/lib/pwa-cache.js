/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/**
 * Os nomes moram aqui e nao na configuracao do build porque o app tambem
 * precisa deles em tempo de execucao: e' o mesmo cache dos dois lados.
 */
export const PWA_CACHE_NAMES = Object.freeze({
  API: 'pai-presente-api',
  ASSETS: 'pai-presente-assets',
});

/**
 * Cache de resposta de API e' do dispositivo, nao da sessao: sem isto, sair da
 * conta deixaria os dados do pai anterior legiveis para o proximo que entrar no
 * mesmo celular.
 */
export async function forgetCachedApiResponses() {
  await globalThis.caches?.delete(PWA_CACHE_NAMES.API);
}
