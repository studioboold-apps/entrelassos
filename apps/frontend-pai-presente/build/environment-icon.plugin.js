/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { APP_ENVIRONMENTS } from '../src/lib/environment.js';

const ICON_HREF_PLACEHOLDER = '%APP_ICON_HREF%';
const ICON_TYPE_PLACEHOLDER = '%APP_ICON_TYPE%';

export const PRODUCTION_ICON = Object.freeze({
  href: '/icons/icon-192.png',
  type: 'image/png',
});

/**
 * A marca fica do tamanho normal e o 🚧 entra como plaquinha no canto inferior
 * esquerdo, a frente do desenho (`web.md` §12). Encolher a marca para abrir
 * espaco ao aviso torna o icone irreconhecivel justamente onde ele e' menor —
 * e e' o icone, nao o titulo, que se le na aba.
 *
 * O aviso e' SVG porque compor o emoji sobre o PNG exigiria rasterizar fonte;
 * o desenho da marca vai embutido em base64 para o favicon nao depender de
 * carregar um segundo arquivo, que o navegador bloqueia dentro de SVG de icone.
 */
export const DEVELOPMENT_ICON = Object.freeze({
  href: '/icons/icon-desenvolvimento.svg',
  type: 'image/svg+xml',
});

export function resolveEnvironmentIcon(environment) {
  return environment === APP_ENVIRONMENTS.PRODUCTION ? PRODUCTION_ICON : DEVELOPMENT_ICON;
}

/**
 * O `index.html` e' um arquivo so para os tres ambientes, entao o icone nao
 * pode estar escrito nele: quem decide e' a variavel do build.
 */
export function environmentIconPlugin({ environment }) {
  const icon = resolveEnvironmentIcon(environment);

  return {
    name: 'pai-presente:environment-icon',
    transformIndexHtml: (html) =>
      html.replaceAll(ICON_HREF_PLACEHOLDER, icon.href).replaceAll(ICON_TYPE_PLACEHOLDER, icon.type),
  };
}
