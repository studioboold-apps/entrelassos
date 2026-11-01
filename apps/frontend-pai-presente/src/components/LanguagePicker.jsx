/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';
import { Languages } from 'lucide-react';

import { useTranslation } from '@/lib/i18n';
import { SUPPORTED_LOCALES, setLocale } from '@/lib/locale';
import { cn } from '@/lib/utils';

/**
 * Cada idioma aparece escrito nele mesmo (`nativeName`): quem caiu no idioma
 * errado nao le o atual, entao o nome do proprio idioma tem de ser reconhecivel
 * sem traducao.
 */
export default function LanguagePicker() {
  const { t, locale } = useTranslation();

  return (
    <div className="px-4 mt-6">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
        <h2 className="font-medium text-zinc-100 flex items-center gap-2 mb-1">
          <Languages aria-hidden="true" className="w-5 h-5 text-zinc-400" />
          {t('perfil.languageSection.title')}
        </h2>
        <p className="text-xs text-zinc-500 mb-4">{t('perfil.languageSection.hint')}</p>

        <div role="radiogroup" aria-label={t('perfil.languageSection.title')} className="flex flex-wrap gap-2">
          {SUPPORTED_LOCALES.map(({ id, nativeName }) => {
            const isActive = id === locale;

            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={isActive}
                lang={id}
                onClick={() => setLocale(id)}
                className={cn(
                  'text-sm px-4 py-2 rounded-full font-medium transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-amber-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700',
                )}
              >
                {nativeName}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
