/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import {
  CHILD_FREE_FIELDS,
  CHILD_GENDER_OPTIONS,
  childFieldLabelKey,
  childFieldPlaceholderKey,
} from '@/lib/profile-options';

const INPUT_CLASS = 'mt-1.5 h-11 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600';

/**
 * Os sete campos do filho num lugar so: o cadastro do onboarding e a edicao do
 * perfil pediam os MESMOS dados em duas listas separadas, e a segunda ja nascia
 * com rotulo diferente da primeira.
 */
export default function ChildFields({ value, onFieldChange }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-zinc-400">{t(childFieldLabelKey('name'))}</Label>
        <Input
          value={value.name}
          placeholder={t(childFieldPlaceholderKey('name'))}
          onChange={(event) => onFieldChange('name', event.target.value)}
          className={INPUT_CLASS}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-zinc-400">{t(childFieldLabelKey('age'))}</Label>
          <Input
            type="number"
            value={value.age}
            placeholder={t(childFieldPlaceholderKey('age'))}
            onChange={(event) => onFieldChange('age', event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <Label className="text-zinc-400">{t(childFieldLabelKey('gender'))}</Label>
          <Select value={value.gender} onValueChange={(gender) => onFieldChange('gender', gender)}>
            <SelectTrigger className="mt-1.5 h-11 bg-zinc-900 border-zinc-800 text-white">
              <SelectValue placeholder={t(childFieldPlaceholderKey('gender'))} />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              {CHILD_GENDER_OPTIONS.map(({ value: option, labelKey }) => (
                <SelectItem key={option} value={option}>{t(labelKey)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
  );
}
