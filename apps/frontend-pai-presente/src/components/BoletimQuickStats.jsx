/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Heart, Star, Target } from 'lucide-react';

import { Progress } from '@/components/ui/progress';
import { useTranslation } from '@/lib/i18n';

const CARD_CLASS = 'bg-zinc-900 rounded-2xl p-4 border border-zinc-800';

/**
 * Fatia da tela de boletim: recebe as contas prontas do hook.
 *
 * @param {{ stats: ReturnType<import('@/lib/boletim-stats').buildMonthStats> }} props
 */
export default function BoletimQuickStats({ stats }) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-3">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={CARD_CLASS}>
        <div className="flex items-center gap-2 mb-2">
          <Calendar aria-hidden="true" className="w-4 h-4 text-blue-600" />
          <span className="text-xs text-zinc-500">{t('boletim.stats.activities')}</span>
        </div>
        <p className="text-2xl font-light text-zinc-100">
          {stats.completedActivities}/{stats.totalActivities}
        </p>
        <Progress value={stats.completionRate} className="mt-2 h-1.5" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={CARD_CLASS}
      >
        <div className="flex items-center gap-2 mb-2">
          <Star aria-hidden="true" className="w-4 h-4 text-emerald-600" />
          <span className="text-xs text-zinc-500">{t('boletim.stats.averageRating')}</span>
        </div>
        {/* Zero e' uma nota — a pior. Ninguem ter avaliado e' outra coisa. */}
        <p className="text-2xl font-light text-zinc-100">
          {stats.avgActivityRating === undefined ? (
            <span className="text-zinc-600">{t('boletim.stats.noRating')}</span>
          ) : (
            <>
              {stats.avgActivityRating}
              <span className="text-zinc-500 text-sm">/5</span>
            </>
          )}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={CARD_CLASS}
      >
        <div className="flex items-center gap-2 mb-2">
          <Heart aria-hidden="true" className="w-4 h-4 text-emerald-600" />
          <span className="text-xs text-zinc-500">{t('boletim.stats.insightsRead')}</span>
        </div>
        <p className="text-2xl font-light text-zinc-100">{stats.totalInsightsRead}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={CARD_CLASS}
      >
        <div className="flex items-center gap-2 mb-2">
          <Target aria-hidden="true" className="w-4 h-4 text-blue-600" />
          <span className="text-xs text-zinc-500">{t('boletim.stats.completionRate')}</span>
        </div>
        <p className="text-2xl font-light text-zinc-100">{stats.completionRate}%</p>
      </motion.div>
    </div>
  );
}
