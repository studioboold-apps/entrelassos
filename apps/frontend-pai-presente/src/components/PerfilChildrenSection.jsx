/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Baby, Pencil, Plus, Trash2 } from 'lucide-react';

import ChildIdentity from '@/components/ChildIdentity';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

/** Fatia da tela de perfil: recebe o retorno do hook, nao props soltas. */
export default function PerfilChildrenSection({ perfil }) {
  const { t } = useTranslation();
  const { children, deleteFailure, setChildToDelete, handleOpenAddChild, handleOpenEditChild } = perfil;

  return (
    <div className="px-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-white flex items-center gap-2">
          <Baby aria-hidden="true" className="w-5 h-5 text-zinc-400" />
          {t('perfil.childrenSection.title')}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenAddChild}
          className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        >
          <Plus aria-hidden="true" className="w-4 h-4 mr-1" />
          {t('perfil.childrenSection.add')}
        </Button>
      </div>

      <div className="space-y-3">
        {children.map((child, index) => (
          <motion.div
            key={child.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4"
          >
            <div className="flex items-center justify-between">
              <ChildIdentity child={child} size="lg" />
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('perfil.childrenSection.edit')}
                  onClick={() => handleOpenEditChild(child)}
                  className="text-zinc-500 hover:text-white"
                >
                  <Pencil aria-hidden="true" className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('perfil.childrenSection.delete')}
                  onClick={() => setChildToDelete(child)}
                  className="text-zinc-500 hover:text-red-400"
                >
                  <Trash2 aria-hidden="true" className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}

        {deleteFailure && (
          <p role="alert" className="text-sm text-red-400 px-1">
            {deleteFailure.message}
          </p>
        )}

        {children.length === 0 && (
          <div className="text-center py-8 bg-zinc-900 rounded-2xl border border-dashed border-zinc-800">
            <Baby aria-hidden="true" className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
            <p className="text-zinc-500">{t('perfil.childrenSection.empty')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
