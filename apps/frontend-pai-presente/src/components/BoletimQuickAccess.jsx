/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

import AiBadge from '@/components/AiBadge';
import { useTranslation } from '@/lib/i18n';
import { createPageUrl } from '@/utils';

const SHORTCUTS = Object.freeze([
  {
    page: 'Juntinhos',
    labelKey: 'boletim.quickAccess.juntinhos',
    hintKey: 'boletim.quickAccess.juntinhosHint',
    icon: Calendar,
    cardClass: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    iconClass: 'bg-blue-500/20 text-blue-600',
  },
  {
    page: 'Chat',
    labelKey: 'boletim.quickAccess.chat',
    hintKey: 'boletim.quickAccess.chatHint',
    icon: HelpCircle,
    cardClass: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
    iconClass: 'bg-emerald-500/20 text-emerald-600',
    ai: true,
  },
]);

/** Fatia da tela de boletim: dois atalhos que nao dependem de nenhum estado. */
export default function BoletimQuickAccess() {
  const { t } = useTranslation();

  return (
    <div className="px-6 mt-8 mb-6">
      <h3 className="text-zinc-100 font-medium mb-4">{t('boletim.quickAccess.title')}</h3>
      <div className="grid grid-cols-2 gap-3">
        {SHORTCUTS.map(({ page, labelKey, hintKey, icon: Icon, cardClass, iconClass, ai }) => (
          <Link key={page} to={createPageUrl(page)}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`bg-gradient-to-br ${cardClass} border rounded-2xl p-4 flex flex-col items-center gap-2`}
            >
              <div className={`relative w-12 h-12 ${iconClass} rounded-xl flex items-center justify-center`}>
                <Icon aria-hidden="true" className="w-6 h-6" />
                {ai && <AiBadge />}
              </div>
              <span className="text-zinc-100 text-sm font-medium">{t(labelKey)}</span>
              <span className="text-zinc-500 text-xs text-center">{t(hintKey)}</span>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
