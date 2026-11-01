/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';

import BrandMark, { BRAND_NAVY } from '@/components/BrandMark';
import { cn } from '@/lib/utils';

/**
 * Espera dentro do app (transicoes, IA pensando): os elos se afastam e voltam
 * a se encaixar, no lugar do spinner generico. Em fundo claro o elo creme vira
 * marinho, senao some.
 */
export default function BrandLoader({ label, size = 'md', className }) {
  return (
    <div role="status" className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <BrandMark motion="loop" cream={BRAND_NAVY} className={size === 'sm' ? 'h-6 w-8' : 'h-12 w-16'} />
      {label ? <p className="text-zinc-500 text-sm">{label}</p> : <span className="sr-only">…</span>}
    </div>
  );
}
