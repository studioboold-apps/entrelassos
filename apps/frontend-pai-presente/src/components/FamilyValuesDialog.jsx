/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React, { useId } from 'react';
import { Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FAMILY_VALUE_FIELDS, findSameFamilyValue, matchFamilyValueOptions } from '@/lib/family-values';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** Um campo livre com as respostas que ja existem logo abaixo, para tocar. */
function FamilyValueField({ field, labelKey, value, options, onChange }) {
  const { t } = useTranslation();
  const inputId = useId();
  const same = findSameFamilyValue(options, value);
  const suggestions = matchFamilyValueOptions(options, same ? '' : value);

  return (
    <div>
      <Label htmlFor={inputId} className="text-zinc-400">
        {t(labelKey)}
      </Label>
      <Input
        id={inputId}
        value={value}
        maxLength={60}
        onChange={(event) => onChange(field, event.target.value)}
        placeholder={t('profile.familyValues.placeholder')}
        className="mt-1.5 bg-zinc-900 border-zinc-700 text-zinc-100"
      />
      {same && same !== value.trim() && (
        <p className="mt-1 text-xs text-zinc-500">{t('profile.familyValues.sameAs', { option: same })}</p>
      )}
      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions.map((option) => {
            const selected = option === same;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(field, selected ? '' : option)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors',
                  selected
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-blue-500',
                )}
              >
                {selected && <Check aria-hidden="true" className="h-3 w-3" />}
                {option}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Dialogo dos valores da familia. Religiao, politica e orientacao sexual sao
 * dado sensivel (LGPD art. 11): tudo opcional, aceite explicito para gravar,
 * e um botao para apagar tudo.
 *
 * @param {{ familyValues: ReturnType<import('./FamilyValues.hook').useFamilyValues> }} props
 */
export default function FamilyValuesDialog({ familyValues }) {
  const { t } = useTranslation();
  const consentId = useId();
  const {
    isOpen,
    setIsOpen,
    form,
    optionsByField,
    hasConsent,
    setHasConsent,
    hasSaved,
    failure,
    isSaving,
    isRemoving,
    canSave,
    handleFieldChange,
    handleSave,
    handleRemove,
  } = familyValues;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-h-[85vh] overflow-y-auto bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">{t('profile.familyValues.title')}</DialogTitle>
          <DialogDescription className="text-zinc-500">{t('profile.familyValues.dialogIntro')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {FAMILY_VALUE_FIELDS.map(({ field, labelKey }) => (
            <FamilyValueField
              key={field}
              field={field}
              labelKey={labelKey}
              value={form[field]}
              options={optionsByField[field]}
              onChange={handleFieldChange}
            />
          ))}

          <div className="flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-50 p-3">
            <Checkbox
              id={consentId}
              checked={hasConsent}
              onCheckedChange={(checked) => setHasConsent(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor={consentId} className="text-xs leading-relaxed text-zinc-300 font-normal">
              {t('profile.familyValues.consent')}
            </Label>
          </div>

          {failure && (
            <p role="alert" className="text-sm text-red-600">
              {failure.message}
            </p>
          )}

          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full bg-gradient-to-r from-blue-500 to-amber-500 text-white"
          >
            {isSaving && <Loader2 aria-hidden="true" className="w-4 h-4 mr-2 animate-spin" />}
            {t('profile.familyValues.save')}
          </Button>

          {hasSaved && (
            <Button
              variant="outline"
              onClick={handleRemove}
              disabled={isRemoving}
              className="w-full bg-transparent border-red-900/50 text-red-600 hover:bg-red-900/20"
            >
              {isRemoving && <Loader2 aria-hidden="true" className="w-4 h-4 mr-2 animate-spin" />}
              {t('profile.familyValues.remove')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
