/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';

import { cn } from '@/lib/utils';

/**
 * "Entre" + "laços" em laranja, com PAI PRESENTE embaixo: o mesmo desenho do
 * nome nas pecas do design. `tone` diz o fundo: `dark` (marinho) ou `light`.
 */
export default function BrandWordmark({ tone = 'light', size = 'md', className }) {
  const isDark = tone === 'dark';
  return (
    <div className={cn('leading-none', className)}>
      <p className={cn('font-extrabold tracking-tight', size === 'lg' ? 'text-4xl' : 'text-3xl')}>
        <span className={isDark ? 'text-[#F3F0E8]' : 'text-brand-navy'}>Entre</span>
        <span className="text-brand-orange">laços</span>
      </p>
      <p
        className={cn(
          'mt-1 font-extrabold tracking-[0.14em]',
          size === 'lg' ? 'text-sm' : 'text-xs',
          isDark ? 'text-[#F3F0E8]' : 'text-brand-navy',
        )}
      >
        PAI PRESENTE
      </p>
    </div>
  );
}
