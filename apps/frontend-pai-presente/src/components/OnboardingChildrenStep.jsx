/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';
import { Baby, Plus, X } from 'lucide-react';

import ChildFields from '@/components/ChildFields';
import ChildIdentity from '@/components/ChildIdentity';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

/**
 * O passo recebe o retorno do hook inteiro de proposito: ele e' uma FATIA da
 * pagina, nao um widget reaproveitavel, e enfileirar seis props aqui so
 * espalharia o mesmo objeto em seis nomes.
 */
export default function OnboardingChildrenStep({ onboarding }) {
  const { t } = useTranslation();
  const { children, newChild, canAddChild, handleNewChildFieldChange, handleAddChild, handleRemoveChild } = onboarding;

  return (
    <>
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center">
          <Baby aria-hidden="true" className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-light text-zinc-100">{t('onboarding.children.title')}</h2>
        <p className="text-zinc-500 mt-2 text-sm">{t('onboarding.children.subtitle')}</p>
      </div>

      {children.length > 0 && (
        <div className="space-y-2 mb-6">
          {children.map((child, index) => (
            <div
              key={`${child.name}-${index}`}
              className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800"
            >
              <ChildIdentity child={child} />
              <button
                type="button"
                aria-label={t('onboarding.children.remove')}
                onClick={() => handleRemoveChild(index)}
                className="p-2 text-zinc-500 hover:text-red-600 transition-colors"
              >
                <X aria-hidden="true" className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 border-2 border-dashed border-zinc-800 rounded-xl space-y-4">
        <p className="text-sm font-medium text-zinc-500">{t('onboarding.children.addTitle')}</p>

        <ChildFields value={newChild} onFieldChange={handleNewChildFieldChange} />

        <Button
          variant="outline"
          className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          onClick={handleAddChild}
          disabled={!canAddChild}
        >
          <Plus aria-hidden="true" className="w-4 h-4 mr-2" />
          {t('onboarding.children.add')}
        </Button>
      </div>
    </>
  );
}
