/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React, { useId, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';

import PersonAvatar from '@/components/PersonAvatar';
import { toAvatarDataUrl } from '@/lib/avatar-image';
import { useTranslation } from '@/lib/i18n';

/**
 * Escolher, trocar e tirar a foto de perfil (do pai ou do filho). A foto e'
 * reduzida aqui mesmo, antes de qualquer envio: quem salva e' o formulario.
 */
export default function AvatarPicker({ name, value, onChange, size = 'xl', showActions = true, isBusy = false }) {
  const { t } = useTranslation();
  const inputId = useId();
  const [isReading, setIsReading] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setIsReading(true);
    setHasFailed(false);
    try {
      onChange(await toAvatarDataUrl(file));
    } catch {
      setHasFailed(true);
    }
    setIsReading(false);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <label htmlFor={inputId} className="relative cursor-pointer" aria-label={value ? t('profile.avatar.change') : t('profile.avatar.choose')}>
        <PersonAvatar name={name} src={value} size={size} />
        <span className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white shadow-md ring-2 ring-white">
          {isReading || isBusy ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <Camera aria-hidden="true" className="h-4 w-4" />
          )}
        </span>
      </label>
      <input id={inputId} type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />

      {showActions && (
      <div className="flex items-center gap-3 text-sm">
        <label htmlFor={inputId} className="cursor-pointer font-medium text-blue-600 hover:underline">
          {value ? t('profile.avatar.change') : t('profile.avatar.choose')}
        </label>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="text-zinc-500 hover:text-red-600">
            {t('profile.avatar.remove')}
          </button>
        )}
      </div>
      )}

      {hasFailed && (
        <p role="alert" className="text-xs text-red-600 text-center">
          {t('profile.avatar.unreadable')}
        </p>
      )}
    </div>
  );
}
