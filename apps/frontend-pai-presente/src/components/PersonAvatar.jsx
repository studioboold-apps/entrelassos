/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';

import { initialOf } from '@/lib/avatar-image';
import { cn } from '@/lib/utils';

const SIZE_CLASS = Object.freeze({
  xs: 'w-8 h-8 text-sm',
  sm: 'w-10 h-10 text-base',
  md: 'w-12 h-12 text-lg',
  lg: 'w-16 h-16 text-2xl',
  xl: 'w-24 h-24 text-3xl',
});

/** Foto quando ha', inicial no amarelo da marca quando nao ha'. */
export default function PersonAvatar({ name, src, size = 'sm', className }) {
  return (
    <div
      className={cn(
        'shrink-0 overflow-hidden rounded-full flex items-center justify-center font-semibold',
        'bg-amber-100 text-blue-700 ring-2 ring-white',
        SIZE_CLASS[size],
        className,
      )}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden="true">{initialOf(name)}</span>
      )}
    </div>
  );
}
