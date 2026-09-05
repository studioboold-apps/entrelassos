/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/**
 * Google e Apple so entregam o botao de login pelo script deles, e os dois
 * precisam ser carregados uma vez so: dois `<script>` iguais reinicializam a
 * biblioteca e o botao ja desenhado para de responder.
 */
const pending = new Map();

export function loadScript(source) {
  const cached = pending.get(source);
  if (cached) return cached;

  const promise = new Promise((resolve, reject) => {
    const element = document.createElement('script');
    element.src = source;
    element.async = true;
    element.onload = () => resolve();
    element.onerror = () => {
      pending.delete(source);
      element.remove();
      reject(new Error(`Nao foi possivel carregar ${source}.`));
    };
    document.head.appendChild(element);
  });

  pending.set(source, promise);
  return promise;
}
