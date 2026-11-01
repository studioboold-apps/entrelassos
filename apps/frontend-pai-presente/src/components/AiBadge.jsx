/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';
import { Sparkles } from 'lucide-react';

import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * Pedido do design: a estrelinha de IA marca o que a IA responde, para o pai
 * saber de onde vem a resposta. Vai no canto do icone; o pai do icone precisa
 * de `relative`.
 */
export default function AiBadge({ className }) {
  const { t } = useTranslation();
  return (
    <span
      role="img"
      aria-label={t('common.aiBadge')}
      title={t('common.aiBadge')}
      className={cn(
        'absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full',
        'bg-gradient-to-br from-blue-500 to-amber-500 text-white shadow-sm ring-2 ring-zinc-950',
        className,
      )}
    >
      <Sparkles aria-hidden="true" className="h-3 w-3" />
    </span>
  );
}
