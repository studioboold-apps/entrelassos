/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import AvatarPicker from '@/components/AvatarPicker';
import OnboardingChildrenStep from '@/components/OnboardingChildrenStep';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BRAND_LOGO } from '@/lib/brand';
import { useTranslation } from '@/lib/i18n';
import { MARITAL_STATUS_OPTIONS } from '@/lib/profile-options';
import { cn } from '@/lib/utils';

import { ONBOARDING_STEPS, useOnboarding } from './Onboarding.hook';

const FIELD_CLASS = 'h-11 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600';
const STEP_MOTION = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function Onboarding() {
  const { t } = useTranslation();
  const onboarding = useOnboarding();
  const {
    stepId,
    stepNumber,
    stepCount,
    currentStep,
    isLastStep,
    isSaving,
    userData,
    userName,
    saveFailure,
    canProceed,
    handleNext,
    handleBack,
    handleUserFieldChange,
    handleComplete,
  } = onboarding;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <div className="px-6 pt-8">
        <div className="flex gap-2">
          {ONBOARDING_STEPS.map((step, index) => (
            <div
              key={step}
              className={cn('h-1 flex-1 rounded-full transition-colors', index <= currentStep ? 'bg-blue-400' : 'bg-zinc-800')}
            />
          ))}
        </div>
        <p className="text-xs text-zinc-600 mt-2 text-center">
          {t('onboarding.progress', { current: stepNumber, total: stepCount })}
        </p>
      </div>

      <div className="flex-1 px-6 py-8">
        <AnimatePresence mode="wait">
          {stepId === 'welcome' && (
            <motion.div {...STEP_MOTION} className="text-center">
              <img src={BRAND_LOGO} alt={t('common.brandLogoAlt')} className="w-28 h-28 mx-auto mb-8 rounded-3xl" />
              <h1 className="text-3xl font-light text-zinc-100">{t('common.brandName')}</h1>
              <p className="text-zinc-500 text-sm uppercase tracking-widest mb-4">{t('common.brandTagline')}</p>
              <p className="text-zinc-400 text-lg mb-2">{t('onboarding.welcome.lead')}</p>
              <p className="text-zinc-500 text-sm">{t('onboarding.welcome.body')}</p>
            </motion.div>
          )}

          {stepId === 'about' && (
            <motion.div {...STEP_MOTION} className="space-y-6">
              <div className="text-center mb-8">
                <div className="mb-4">
                  <AvatarPicker
                    name={userName}
                    value={userData.avatar_url}
                    onChange={(url) => handleUserFieldChange('avatar_url', url)}
                    size="lg"
                  />
                </div>
                <h2 className="text-2xl font-light text-zinc-100">{t('onboarding.about.title')}</h2>
                <p className="text-zinc-500 mt-2 text-sm">{t('onboarding.about.subtitle')}</p>
              </div>

              <div>
                <Label htmlFor="age" className="text-zinc-400">{t('onboarding.about.ageLabel')}</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder={t('onboarding.about.agePlaceholder')}
                  value={userData.age}
                  onChange={(event) => handleUserFieldChange('age', event.target.value)}
                  className={cn(FIELD_CLASS, 'mt-1.5 h-12')}
                />
              </div>

              <div>
                <Label htmlFor="city" className="text-zinc-400">{t('profile.city.label')}</Label>
                <Input
                  id="city"
                  autoComplete="address-level2"
                  placeholder={t('profile.city.placeholder')}
                  value={userData.city}
                  onChange={(event) => handleUserFieldChange('city', event.target.value)}
                  className={cn(FIELD_CLASS, 'mt-1.5 h-12')}
                />
                <p className="mt-1.5 text-xs text-zinc-500">{t('profile.city.hint')}</p>
              </div>
            </motion.div>
          )}

          {stepId === 'preferences' && (
            <motion.div {...STEP_MOTION} className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-light text-zinc-100">{t('onboarding.preferences.title')}</h2>
                <p className="text-zinc-500 mt-2 text-sm">{t('onboarding.preferences.subtitle')}</p>
              </div>

              <div>
                <Label className="text-zinc-400">{t('onboarding.preferences.maritalStatusLabel')}</Label>
                <Select
                  value={userData.marital_status}
                  onValueChange={(value) => handleUserFieldChange('marital_status', value)}
                >
                  <SelectTrigger className="mt-1.5 h-12 bg-zinc-900 border-zinc-800 text-zinc-100">
                    <SelectValue placeholder={t('onboarding.preferences.maritalStatusPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {MARITAL_STATUS_OPTIONS.map(({ value, labelKey }) => (
                      <SelectItem key={value} value={value}>{t(labelKey)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}

          {stepId === 'children' && (
            <motion.div {...STEP_MOTION} className="space-y-6">
              <OnboardingChildrenStep onboarding={onboarding} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-6 pb-8 space-y-3">
        {saveFailure && (
          <p role="alert" className="text-sm text-red-600 text-center">
            {saveFailure.message}
          </p>
        )}

        {isLastStep ? (
          <Button
            className="w-full h-14 text-lg bg-gradient-to-r from-blue-500 to-amber-500 hover:from-blue-600 hover:to-amber-600 text-white font-medium"
            onClick={handleComplete}
            disabled={isSaving || !canProceed}
          >
            {isSaving ? t('onboarding.saving') : t('onboarding.finish')}
          </Button>
        ) : (
          <Button
            className="w-full h-14 text-lg bg-gradient-to-r from-blue-500 to-amber-500 hover:from-blue-600 hover:to-amber-600 text-white font-medium"
            onClick={handleNext}
            disabled={!canProceed}
          >
            {t('onboarding.continue')}
            <ArrowRight aria-hidden="true" className="w-5 h-5 ml-2" />
          </Button>
        )}

        {currentStep > 0 && (
          <Button variant="ghost" className="w-full text-zinc-500 hover:text-zinc-300" onClick={handleBack}>
            <ArrowLeft aria-hidden="true" className="w-4 h-4 mr-2" />
            {t('onboarding.back')}
          </Button>
        )}
      </div>
    </div>
  );
}
