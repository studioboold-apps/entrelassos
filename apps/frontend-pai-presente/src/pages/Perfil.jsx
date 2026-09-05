/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, Pencil, User } from 'lucide-react';

import ChildDeleteDialog from '@/components/ChildDeleteDialog';
import ChildEditDialog from '@/components/ChildEditDialog';
import PerfilChildrenSection from '@/components/PerfilChildrenSection';
import ProfileEditDialog from '@/components/ProfileEditDialog';
import { Button } from '@/components/ui/button';
import { BRAND_LOGO } from '@/lib/brand';
import { useTranslation } from '@/lib/i18n';

import { usePerfil } from './Perfil.hook';

const STAT_CARD = 'bg-zinc-900 rounded-2xl p-4 text-center border border-zinc-800';

export default function Perfil() {
  const { t } = useTranslation();
  const perfil = usePerfil();
  const {
    user,
    averageGrade,
    completedActivities,
    handleOpenEditProfile,
    handleLogout,
  } = perfil;

  const stats = [
    { key: 'children', labelKey: 'perfil.stats.children', value: perfil.children.length, tone: 'text-white' },
    { key: 'activities', labelKey: 'perfil.stats.activities', value: completedActivities, tone: 'text-emerald-400' },
    {
      key: 'average',
      labelKey: 'perfil.stats.average',
      value: averageGrade === undefined ? t('perfil.stats.noAverage') : `${averageGrade}⭐`,
      tone: 'text-blue-400',
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      <div className="px-6 pt-10 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <img src={BRAND_LOGO} alt={t('common.brandLogoAlt')} className="w-12 h-12 rounded-xl" />
          <span className="text-blue-400 font-medium">{t('common.brandName')}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400/20 to-emerald-400/20 border border-blue-400/30 flex items-center justify-center text-2xl font-light text-blue-400">
            {user?.full_name?.[0] ?? t('perfil.fallbackInitial')}
          </div>
          <div>
            <h1 className="text-xl font-light text-white">{user?.full_name ?? t('perfil.fallbackName')}</h1>
            <p className="text-zinc-500 text-sm">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="px-4 mb-8">
        <div className="grid grid-cols-3 gap-3">
          {stats.map(({ key, labelKey, value, tone }, index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={STAT_CARD}
            >
              <p className={`text-2xl font-light ${tone}`}>{value}</p>
              <p className="text-xs text-zinc-500 mt-1">{t(labelKey)}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="px-4 mb-6">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-white flex items-center gap-2">
              <User aria-hidden="true" className="w-5 h-5 text-zinc-400" />
              {t('perfil.profileSection.title')}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              aria-label={t('perfil.profileSection.edit')}
              onClick={handleOpenEditProfile}
              className="text-zinc-400 hover:text-white"
            >
              <Pencil aria-hidden="true" className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">{t('perfil.profileSection.age')}</span>
              <span className="text-zinc-300">
                {user?.age ? t('perfil.profileSection.ageValue', { age: user.age }) : t('perfil.emptyValue')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">{t('perfil.profileSection.maritalStatus')}</span>
              <span className="text-zinc-300">
                {user?.marital_status ? t(`profile.maritalStatus.${user.marital_status}`) : t('perfil.emptyValue')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <PerfilChildrenSection perfil={perfil} />

      <div className="px-4 mt-8">
        <Button
          variant="outline"
          className="w-full bg-transparent border-red-900/50 text-red-400 hover:bg-red-900/20"
          onClick={handleLogout}
        >
          <LogOut aria-hidden="true" className="w-4 h-4 mr-2" />
          {t('perfil.logout')}
        </Button>
      </div>

      <div className="px-4 mt-8 pb-8 text-center">
        <div className="flex items-center justify-center gap-2 text-zinc-600">
          <img src={BRAND_LOGO} alt={t('common.brandLogoAlt')} className="w-6 h-6 rounded-md opacity-50" />
          <span className="text-sm">{t('common.brandName')}</span>
        </div>
      </div>

      <ProfileEditDialog perfil={perfil} />
      <ChildEditDialog perfil={perfil} />
      <ChildDeleteDialog perfil={perfil} />
    </div>
  );
}
