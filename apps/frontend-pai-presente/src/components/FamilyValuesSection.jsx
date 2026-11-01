/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';
import { Lock, Pencil } from 'lucide-react';

import AiBadge from '@/components/AiBadge';
import FamilyValuesDialog from '@/components/FamilyValuesDialog';
import { useFamilyValues } from '@/components/FamilyValues.hook';
import { Button } from '@/components/ui/button';
import { FAMILY_VALUE_FIELDS } from '@/lib/family-values';
import { useTranslation } from '@/lib/i18n';

/**
 * Pedido do design: orientacao segmentada. O pai conta, se quiser, religiao,
 * posicionamento politico e orientacao sexual, e a IA adapta o tom.
 */
export default function FamilyValuesSection() {
  const { t } = useTranslation();
  const familyValues = useFamilyValues();
  const { saved, hasSaved, handleOpen } = familyValues;

  return (
    <div className="px-4 mb-6">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium text-zinc-100 flex items-center gap-2">
            <span className="relative">
              <Lock aria-hidden="true" className="w-5 h-5 text-zinc-400" />
            </span>
            {t('profile.familyValues.title')}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('profile.familyValues.edit')}
            onClick={handleOpen}
            className="text-zinc-400 hover:text-zinc-100"
          >
            <Pencil aria-hidden="true" className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-zinc-500 mb-4 flex items-start gap-2">
          <span className="relative mt-0.5 inline-flex h-4 w-4 shrink-0">
            <AiBadge className="static h-4 w-4 ring-0" />
          </span>
          {t('profile.familyValues.intro')}
        </p>

        {hasSaved ? (
          <div className="space-y-3 text-sm">
            {FAMILY_VALUE_FIELDS.map(({ field, labelKey }) => (
              <div key={field} className="flex justify-between gap-4">
                <span className="text-zinc-500">{t(labelKey)}</span>
                <span className="text-zinc-300 truncate">{saved?.[field] ?? t('profile.familyValues.notInformed')}</span>
              </div>
            ))}
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={handleOpen}
            className="w-full bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-blue-500"
          >
            {t('profile.familyValues.start')}
          </Button>
        )}
      </div>
      <FamilyValuesDialog familyValues={familyValues} />
    </div>
  );
}
