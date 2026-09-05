/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '@/api/client';
import { describeApiFailure } from '@/lib/api-error-message';
import { toProfileUpdate } from '@/lib/profile-form';
import { createPageUrl } from '@/utils';

/** O passo e' identidade estavel; o titulo que a pessoa le vem do locale (§6). */
export const ONBOARDING_STEPS = Object.freeze(['welcome', 'about', 'preferences', 'children']);

const EMPTY_CHILD = Object.freeze({
  name: '',
  age: '',
  gender: '',
  favorite_hobby: '',
  favorite_color: '',
  favorite_food: '',
  favorite_movie_genre: '',
});

export function useOnboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [userData, setUserData] = useState({ age: '', marital_status: '' });
  const [children, setChildren] = useState([]);
  const [saveFailure, setSaveFailure] = useState(null);
  const [newChild, setNewChild] = useState(EMPTY_CHILD);

  const stepId = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (!isLastStep) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleUserFieldChange = (field, value) => {
    setUserData((previous) => ({ ...previous, [field]: value }));
  };

  const handleNewChildFieldChange = (field, value) => {
    setNewChild((previous) => ({ ...previous, [field]: value }));
  };

  const canAddChild = Boolean(newChild.name && newChild.age && newChild.gender);

  const handleAddChild = () => {
    if (!canAddChild) return;

    setChildren((previous) => [...previous, { ...newChild, age: Number.parseInt(newChild.age, 10) }]);
    setNewChild(EMPTY_CHILD);
  };

  const handleRemoveChild = (index) => {
    setChildren((previous) => previous.filter((_, position) => position !== index));
  };

  const handleComplete = async () => {
    setIsSaving(true);
    setSaveFailure(null);
    try {
      /**
       * Idade em branco virava `NaN` e depois `null` no corpo, e a API recusava
       * a conclusao INTEIRA do onboarding — os filhos nem chegavam a ser
       * criados. O corpo se monta no mesmo modulo que o Perfil usa.
       */
      await api.auth.updateMe({ ...toProfileUpdate(userData), onboarding_completed: true });

      for (const child of children) {
        await api.entities.Child.create(child);
      }

      navigate(createPageUrl('Home'));
    } catch (error) {
      /**
       * Antes daqui so saia `console.error`: o botao voltava de "Salvando..." e
       * nada acontecia. O pai nao tem console — para ele o aplicativo apenas nao
       * salvava. A recusa da API ja nomeia os campos; agora ela chega na tela.
       */
      setSaveFailure(describeApiFailure(error));
    }
    setIsSaving(false);
  };

  /** So o passo "sobre voce" e o dos filhos exigem preenchimento. */
  const canProceed = stepId === 'about'
    ? Boolean(userData.age)
    : stepId !== 'children' || children.length > 0;

  return {
    stepId,
    stepNumber: currentStep + 1,
    stepCount: ONBOARDING_STEPS.length,
    currentStep,
    isLastStep,
    isSaving,
    userData,
    children,
    newChild,
    saveFailure,
    canAddChild,
    canProceed,
    handleNext,
    handleBack,
    handleUserFieldChange,
    handleNewChildFieldChange,
    handleAddChild,
    handleRemoveChild,
    handleComplete,
  };
}
