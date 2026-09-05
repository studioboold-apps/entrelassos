/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

export const APP_ENVIRONMENTS = Object.freeze({
  LOCAL: 'local',
  STAGING: 'staging',
  PRODUCTION: 'production',
});

const KNOWN_ENVIRONMENTS = new Set(Object.values(APP_ENVIRONMENTS));

/**
 * Ausente ou desconhecido cai em producao (`web.md` §12). O default seguro e' o
 * contrario do intuitivo: variavel esquecida no painel de hospedagem faria a
 * instalacao do pai abrir com faixa de teste e icone de obra.
 */
export function resolveAppEnvironment(value) {
  const normalized = String(value ?? '').trim().toLowerCase();

  return KNOWN_ENVIRONMENTS.has(normalized) ? normalized : APP_ENVIRONMENTS.PRODUCTION;
}

/**
 * `import.meta.env` nao existe quando este modulo e' lido pelo carregador do
 * `vite.config.js` — la quem le a variavel e' o `process.env`, e o valor entra
 * pelo parametro do plugin.
 */
export const appEnvironment = resolveAppEnvironment(import.meta.env?.VITE_APP_ENV);

export const isProductionEnvironment = appEnvironment === APP_ENVIRONMENTS.PRODUCTION;

/**
 * Producao nao tem rotulo, e e' isso que decide se a faixa aparece: uma segunda
 * condicao em outro arquivo divergiria dela na primeira edicao.
 */
const ENVIRONMENT_BANNER_LABELS = Object.freeze({
  [APP_ENVIRONMENTS.LOCAL]: 'Ambiente local — nada aqui é dado de verdade',
  [APP_ENVIRONMENTS.STAGING]: 'Homologação — nada aqui é dado de verdade',
});

export function environmentBannerLabel(environment) {
  return ENVIRONMENT_BANNER_LABELS[environment];
}
