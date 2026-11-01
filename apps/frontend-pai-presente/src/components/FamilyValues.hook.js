/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { useState } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { describeApiFailure } from '@/lib/api-error-message';
import { FAMILY_VALUE_FIELDS, findSameFamilyValue } from '@/lib/family-values';

const QUERY_KEY = ['familyValues'];
const EMPTY_FORM = Object.freeze({ religion: '', politics: '', orientation: '' });

/**
 * A secao de valores da familia decide aqui (`web.md` §4): o que mostrar, o
 * formulario, o aceite e as tres escritas.
 */
export function useFamilyValues() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [hasConsent, setHasConsent] = useState(false);

  const { data: saved } = useQuery({ queryKey: QUERY_KEY, queryFn: () => api.entities.FamilyValues.get() });

  /** As sugestoes so' sao buscadas com o dialogo aberto: quem nao abre nao gasta. */
  const optionQueries = useQueries({
    queries: FAMILY_VALUE_FIELDS.map(({ kind }) => ({
      queryKey: ['familyValueOptions', kind],
      queryFn: () => api.entities.FamilyValues.options(kind),
      enabled: isOpen,
      staleTime: 5 * 60 * 1000,
    })),
  });
  const optionsByField = Object.fromEntries(
    FAMILY_VALUE_FIELDS.map(({ field }, index) => [field, optionQueries[index].data ?? []]),
  );

  const saveMutation = useMutation({
    mutationFn: (values) => api.entities.FamilyValues.save(values),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data);
      queryClient.invalidateQueries({ queryKey: ['familyValueOptions'] });
      setIsOpen(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => api.entities.FamilyValues.remove(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setIsOpen(false);
    },
  });

  const hasSaved = Boolean(saved?.consent_granted_at);

  const handleOpen = () => {
    saveMutation.reset();
    removeMutation.reset();
    setForm({
      religion: saved?.religion ?? '',
      politics: saved?.politics ?? '',
      orientation: saved?.orientation ?? '',
    });
    /** Quem ja' aceitou nao precisa marcar de novo a cada edicao. */
    setHasConsent(hasSaved);
    setIsOpen(true);
  };

  const handleFieldChange = (field, value) => setForm((previous) => ({ ...previous, [field]: value }));

  /**
   * Antes de enviar, o texto que bate com uma opcao existente vira A opcao
   * ("catolica" -> "Católica"). A API faz o mesmo; fazer aqui tambem deixa a
   * tela mostrar o nome certo sem esperar a volta.
   */
  const handleSave = () => {
    const values = Object.fromEntries(
      FAMILY_VALUE_FIELDS.map(({ field }) => {
        const typed = form[field].trim();
        return [field, typed === '' ? null : (findSameFamilyValue(optionsByField[field], typed) ?? typed)];
      }),
    );
    saveMutation.mutate(values);
  };

  const failure = saveMutation.isError
    ? describeApiFailure(saveMutation.error)
    : removeMutation.isError
      ? describeApiFailure(removeMutation.error)
      : null;

  return {
    saved,
    hasSaved,
    isOpen,
    setIsOpen,
    form,
    optionsByField,
    hasConsent,
    setHasConsent,
    failure,
    isSaving: saveMutation.isPending,
    isRemoving: removeMutation.isPending,
    canSave: hasConsent && !saveMutation.isPending,
    handleOpen,
    handleFieldChange,
    handleSave,
    handleRemove: () => removeMutation.mutate(),
  };
}
