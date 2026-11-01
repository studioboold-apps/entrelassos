/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';

import AvatarPicker from '@/components/AvatarPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';
import {
  CHILD_FREE_FIELDS,
  CHILD_GENDER_OPTIONS,
  childFieldLabelKey,
  childFieldPlaceholderKey,
} from '@/lib/profile-options';
import { cn } from '@/lib/utils';

const INPUT_CLASS = 'mt-1.5 h-12 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-base';

/**
 * Feedback do design (nov/2026): o formulario com os sete campos de uma vez
 * "cansa e intimida". Aqui e' uma pergunta por tela, e so' as duas primeiras
 * sao obrigatorias — foto e gostos tem "Pular".
 */
export const CHILD_WIZARD_STEPS = Object.freeze(['name', 'basics', 'photo', 'likes']);

export function isChildWizardStepValid(stepId, value) {
  if (stepId === 'name') return value.name.trim() !== '';
  if (stepId === 'basics') {
    const age = Number.parseInt(value.age, 10);
    return Number.isInteger(age) && age >= 0 && age <= 25 && value.gender !== '';
  }
  return true;
}

const STEP_MOTION = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { duration: 0.18 },
};

export default function ChildWizard({ value, onFieldChange, onFinish, onCancel, isSaving = false, failure, finishLabel }) {
  const { t } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const stepId = CHILD_WIZARD_STEPS[stepIndex];
  const isLastStep = stepIndex === CHILD_WIZARD_STEPS.length - 1;
  const isOptionalStep = stepId === 'photo' || stepId === 'likes';
  const canAdvance = isChildWizardStepValid(stepId, value);
  const childName = value.name.trim() || t('profile.wizard.yourChild');

  function handleNext() {
    if (!canAdvance) return;
    if (isLastStep) {
      onFinish();
      return;
    }
    setStepIndex(stepIndex + 1);
  }

  function handleBack() {
    if (stepIndex === 0) {
      onCancel?.();
      return;
    }
    setStepIndex(stepIndex - 1);
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        handleNext();
      }}
    >
      <div className="flex items-center gap-1.5" aria-label={t('profile.wizard.progress', { current: stepIndex + 1, total: CHILD_WIZARD_STEPS.length })}>
        {CHILD_WIZARD_STEPS.map((step, index) => (
          <span
            key={step}
            className={cn('h-1.5 flex-1 rounded-full transition-colors', index <= stepIndex ? 'bg-blue-500' : 'bg-zinc-800')}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={stepId} {...STEP_MOTION} className="space-y-4 min-h-[13rem]">
          <div>
            <h3 className="text-xl font-semibold text-zinc-100">
              {t(`profile.wizard.steps.${stepId}.title`, { name: childName })}
            </h3>
            <p className="mt-1 text-sm text-zinc-500">{t(`profile.wizard.steps.${stepId}.hint`, { name: childName })}</p>
          </div>

          {stepId === 'name' && (
            <Input
              autoFocus
              value={value.name}
              aria-label={t(childFieldLabelKey('name'))}
              placeholder={t(childFieldPlaceholderKey('name'))}
              onChange={(event) => onFieldChange('name', event.target.value)}
              className={INPUT_CLASS}
            />
          )}

          {stepId === 'basics' && (
            <div className="space-y-4">
              <div>
                <Label className="text-zinc-400">{t(childFieldLabelKey('age'))}</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={25}
                  value={value.age}
                  placeholder={t(childFieldPlaceholderKey('age'))}
                  onChange={(event) => onFieldChange('age', event.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <Label className="text-zinc-400">{t(childFieldLabelKey('gender'))}</Label>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {CHILD_GENDER_OPTIONS.map(({ value: option, labelKey }) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => onFieldChange('gender', option)}
                      aria-pressed={value.gender === option}
                      className={cn(
                        'h-12 rounded-xl border text-sm font-medium transition-colors',
                        value.gender === option
                          ? 'border-transparent bg-gradient-to-r from-blue-500 to-amber-500 text-white'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700',
                      )}
                    >
                      {t(labelKey)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {stepId === 'photo' && (
            <div className="py-2">
              <AvatarPicker name={value.name} value={value.avatar_url} onChange={(url) => onFieldChange('avatar_url', url)} />
            </div>
          )}

          {stepId === 'likes' && (
            <div className="space-y-3">
              {CHILD_FREE_FIELDS.map((field) => (
                <div key={field}>
                  <Label className="text-zinc-400">{t(childFieldLabelKey(field))}</Label>
                  <Input
                    value={value[field] ?? ''}
                    placeholder={t(childFieldPlaceholderKey(field))}
                    onChange={(event) => onFieldChange(field, event.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {failure && (
        <p role="alert" className="text-sm text-red-600">
          {failure.message}
        </p>
      )}

      <div className="flex gap-3">
        {(stepIndex > 0 || onCancel) && (
          <Button type="button" variant="outline" onClick={handleBack} className="h-12 border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800">
            <ArrowLeft aria-hidden="true" className="mr-1 h-4 w-4" />
            {stepIndex === 0 ? t('profile.wizard.cancel') : t('profile.wizard.back')}
          </Button>
        )}
        <Button
          type="submit"
          disabled={!canAdvance || isSaving}
          className="h-12 flex-1 bg-gradient-to-r from-blue-500 to-amber-500 hover:from-blue-600 hover:to-amber-600 text-white font-medium"
        >
          {isSaving ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : isLastStep ? (
            <>
              <Check aria-hidden="true" className="mr-1 h-4 w-4" />
              {finishLabel ?? t('profile.wizard.finish')}
            </>
          ) : (
            <>
              {isOptionalStep && !hasOptionalAnswer(stepId, value) ? t('profile.wizard.skip') : t('profile.wizard.next')}
              <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function hasOptionalAnswer(stepId, value) {
  if (stepId === 'photo') return Boolean(value.avatar_url);
  return CHILD_FREE_FIELDS.some((field) => (value[field] ?? '').trim() !== '');
}
