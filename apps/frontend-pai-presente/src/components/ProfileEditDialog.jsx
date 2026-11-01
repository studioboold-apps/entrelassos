/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import { MARITAL_STATUS_OPTIONS } from '@/lib/profile-options';

/** Fatia da tela de perfil: recebe o retorno do hook, nao props soltas. */
export default function ProfileEditDialog({ perfil }) {
  const { t } = useTranslation();
  const {
    isEditProfileOpen,
    setShowEditProfile,
    profileForm,
    profileFailure,
    isSavingProfile,
    handleProfileFieldChange,
    handleSaveProfile,
  } = perfil;

  return (
    <Dialog open={isEditProfileOpen} onOpenChange={setShowEditProfile}>
      <DialogContent className="bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">{t('perfil.editProfile.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-zinc-400">{t('perfil.editProfile.ageLabel')}</Label>
            <Input
              type="number"
              value={profileForm.age}
              onChange={(event) => handleProfileFieldChange('age', event.target.value)}
              className="mt-1.5 bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>

          <div>
            <Label className="text-zinc-400">{t('perfil.editProfile.maritalStatusLabel')}</Label>
            <Select
              value={profileForm.marital_status}
              onValueChange={(value) => handleProfileFieldChange('marital_status', value)}
            >
              <SelectTrigger className="mt-1.5 bg-zinc-800 border-zinc-700 text-zinc-100">
                <SelectValue placeholder={t('perfil.editProfile.maritalStatusPlaceholder')} />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {MARITAL_STATUS_OPTIONS.map(({ value, labelKey }) => (
                  <SelectItem key={value} value={value}>{t(labelKey)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-zinc-400">{t('profile.city.label')}</Label>
            <Input
              autoComplete="address-level2"
              value={profileForm.city}
              placeholder={t('profile.city.placeholder')}
              onChange={(event) => handleProfileFieldChange('city', event.target.value)}
              className="mt-1.5 bg-zinc-800 border-zinc-700 text-zinc-100"
            />
            <p className="mt-1.5 text-xs text-zinc-500">{t('profile.city.hint')}</p>
          </div>

          {profileFailure && (
            <p role="alert" className="text-sm text-red-600">
              {profileFailure.message}
            </p>
          )}

          <Button
            className="w-full bg-gradient-to-r from-blue-500 to-amber-500 hover:from-blue-600 hover:to-amber-600 text-white"
            onClick={handleSaveProfile}
            disabled={isSavingProfile}
          >
            {isSavingProfile ? t('perfil.saving') : t('perfil.save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
