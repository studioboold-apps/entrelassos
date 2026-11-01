/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';

import { useTranslation } from '@/lib/i18n';
import { childGenderNounKey } from '@/lib/profile-options';
import { cn } from '@/lib/utils';

/** A mesma linha do filho no onboarding e no perfil: inicial, nome e resumo. */
export default function ChildIdentity({ child, size = 'sm' }) {
  const { t } = useTranslation();
  const isLarge = size === 'lg';

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'rounded-full flex items-center justify-center text-emerald-600 font-medium',
          isLarge
            ? 'w-12 h-12 text-lg bg-emerald-400/10 border border-emerald-400/30'
            : 'w-10 h-10 bg-zinc-800',
        )}
      >
        {child.name[0]}
      </div>
      <div>
        <p className="font-medium text-zinc-100">{child.name}</p>
        <p className="text-sm text-zinc-500">
          {t('profile.childSummary', { age: child.age, gender: t(childGenderNounKey(child.gender)) })}
        </p>
      </div>
    </div>
  );
}
