/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { APP_ENVIRONMENTS, appEnvironment } from '@/lib/environment';

const ADSENSE_SCRIPT_URL = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';

/**
 * O anuncio so liga com os DOIS ids: cliente sem bloco desenharia um quadro
 * vazio; bloco sem cliente baixaria o script do Google para nada.
 *
 * Fora de producao o bloco vai com `data-adtest="on"`: clique de quem testa
 * contaria como clique invalido, e o Google suspende conta por isso.
 *
 * @param {{ clientId?: string, slotId?: string, environment?: string }} source
 */
export function resolveAdvertisingConfig({ clientId, slotId, environment }) {
  const client = String(clientId ?? '').trim();
  const slot = String(slotId ?? '').trim();
  const enabled = client.length > 0 && slot.length > 0;

  return Object.freeze({
    enabled,
    clientId: enabled ? client : '',
    slotId: enabled ? slot : '',
    testMode: environment !== APP_ENVIRONMENTS.PRODUCTION,
  });
}

/** @param {string} clientId */
export function buildAdsenseScriptUrl(clientId) {
  return `${ADSENSE_SCRIPT_URL}?client=${encodeURIComponent(clientId)}`;
}

/**
 * `import.meta.env` nao existe quando o modulo e' lido pelos testes do bun.
 */
export const advertisingConfig = resolveAdvertisingConfig({
  clientId: import.meta.env?.VITE_ADSENSE_CLIENT_ID,
  slotId: import.meta.env?.VITE_ADSENSE_SLOT_ID,
  environment: appEnvironment,
});
