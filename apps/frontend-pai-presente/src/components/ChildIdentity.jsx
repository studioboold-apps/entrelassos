/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';

import PersonAvatar from '@/components/PersonAvatar';
import { useTranslation } from '@/lib/i18n';
import { childGenderNounKey } from '@/lib/profile-options';

/** A mesma linha do filho no onboarding e no perfil: inicial, nome e resumo. */
export default function ChildIdentity({ child, size = 'sm' }) {
  const { t } = useTranslation();
  const isLarge = size === 'lg';

  return (
    <div className="flex items-center gap-3">
      <PersonAvatar name={child.name} src={child.avatar_url} size={isLarge ? 'md' : 'sm'} />
      <div className="min-w-0">
        <p className="font-medium text-zinc-100 truncate">{child.name}</p>
        <p className="text-sm text-zinc-500">
          {t('profile.childSummary', { age: child.age, gender: t(childGenderNounKey(child.gender)) })}
        </p>
      </div>
    </div>
  );
}
