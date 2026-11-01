/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';

import BrandMark from '@/components/BrandMark';
import BrandWordmark from '@/components/BrandWordmark';
import { splashElapsedMs } from '@/lib/splash';

/**
 * Abertura do app (pedido do design, nov/2026): os dois elos entram, se
 * encaixam e o coracao bate uma vez; o nome sobe logo depois. Mesmo fundo
 * marinho e mesma composicao da tela estatica do `index.html`, que aparece
 * antes do JavaScript — assim a troca de uma para a outra nao pisca.
 */
export default function BrandSplash({ label = 'Carregando' }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-brand-navy"
      style={{ '--splash-elapsed': `-${splashElapsedMs()}ms` }}
    >
      <style>{`
        @keyframes splash-fade-up { from { transform: translateY(8px); opacity: 0 } to { transform: none; opacity: 1 } }
        .splash-word { animation: splash-fade-up 400ms ease-out calc(650ms + var(--splash-elapsed, 0ms)) both }
        @media (prefers-reduced-motion: reduce) { .splash-word { animation: none } }
      `}</style>
      <BrandMark motion="enter" className="h-28 w-36" />
      <BrandWordmark tone="dark" size="lg" className="splash-word text-center" />
    </div>
  );
}
