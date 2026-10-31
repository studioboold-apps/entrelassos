/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/**
 * O id de editor do AdSense (`ca-pub-` + 16 digitos). Ele NAO e' segredo: sai
 * no HTML de qualquer site com anuncio. Errado, ele nao quebra nada visivel — o
 * Google so nao paga. Por isso a forma e' conferida no BOOT (`nodejs.md`).
 */
const ADSENSE_CLIENT_ID_PATTERN = /^ca-pub-\d{10,20}$/;

/**
 * Id do Google para o vendedor "AdSense" no padrao IAB `ads.txt`. E' o mesmo
 * para toda conta — vem do proprio painel do AdSense.
 */
const GOOGLE_CERTIFICATION_AUTHORITY_ID = 'f08c47fec0942fa0';

/**
 * As origens que o `adsbygoogle.js` usa. O anuncio em si roda num iframe do
 * Google, na origem DELE — a CSP daqui so precisa deixar o carregador entrar,
 * falar com o leilao e desenhar o iframe. Nada disto abre `'unsafe-inline'` em
 * `script-src`.
 */
export const ADVERTISING_POLICY_SOURCES = Object.freeze({
  'script-src': [
    'https://pagead2.googlesyndication.com',
    'https://*.googlesyndication.com',
    'https://*.adtrafficquality.google',
    'https://*.doubleclick.net',
    'https://www.googletagservices.com',
    'https://adservice.google.com',
  ],
  'connect-src': [
    'https://*.googlesyndication.com',
    'https://*.adtrafficquality.google',
    'https://*.doubleclick.net',
    'https://adservice.google.com',
    'https://*.google.com',
  ],
  'frame-src': [
    'https://*.googlesyndication.com',
    'https://*.adtrafficquality.google',
    'https://*.doubleclick.net',
    'https://*.google.com',
  ],
  /** Pixel de medicao vem de dominio que o anunciante escolhe. */
  'img-src': ['https:'],
});

/**
 * Vazio DESLIGA os anuncios: CSP fechada como antes, e `/ads.txt` em 404.
 *
 * @param {string | undefined} value
 * @returns {string} o id validado, ou `''` quando desligado
 */
export function readAdsenseClientId(value) {
  const clientId = (value ?? '').trim();
  if (clientId.length === 0) return '';
  if (!ADSENSE_CLIENT_ID_PATTERN.test(clientId)) {
    throw new Error(`ADSENSE_CLIENT_ID invalido: ${clientId} (esperado ca-pub-XXXXXXXXXXXXXXXX)`);
  }
  return clientId;
}

const ENABLED_VALUES = new Set(['1', 'true', 'on', 'yes', 'sim']);

/**
 * O interruptor GERAL. So liga com valor explicito: ausente, vazio ou qualquer
 * outra coisa e' desligado — anuncio ligado por engano e' clique de teste
 * contado como invalido, e o Google suspende conta por isso.
 *
 * @param {string | undefined} value
 */
export function readAdsEnabled(value) {
  return ENABLED_VALUES.has(String(value ?? '').trim().toLowerCase());
}

/**
 * O id que o servidor usa (CSP e `ads.txt`). `''` = anuncio desligado.
 *
 * Id preenchido e' conferido mesmo com o interruptor desligado: o erro aparece
 * no dia em que se cadastra o id, nao no dia em que se liga. Interruptor ligado
 * SEM id derruba o boot — ligar e nao ver anuncio nenhum parece bug do Google.
 *
 * @param {Record<string, string | undefined>} source
 */
export function readAdvertisingClientId(source) {
  const clientId = readAdsenseClientId(source.ADSENSE_CLIENT_ID);
  if (!readAdsEnabled(source.ADS_ENABLED)) return '';
  if (clientId.length === 0) throw new Error('ADS_ENABLED ligado sem ADSENSE_CLIENT_ID');
  return clientId;
}

/**
 * O Google retém o pagamento enquanto o `ads.txt` do dominio nao declara a
 * conta. A linha usa `pub-…`, sem o `ca-` do id de cliente.
 *
 * @param {string} clientId
 */
export function buildAdsTxt(clientId) {
  const publisherId = clientId.replace(/^ca-/, '');
  return `google.com, ${publisherId}, DIRECT, ${GOOGLE_CERTIFICATION_AUTHORITY_ID}\n`;
}
