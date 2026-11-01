/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from '@/lib/i18n';

/**
 * Fatia da tela de Juntinhos: recebe o retorno do hook, nao props soltas.
 *
 * @param {{ juntinhos: ReturnType<import('@/pages/Juntinhos.hook').useJuntinhos> }} props
 */
export default function ActivitySuggestionsDialog({ juntinhos }) {
  const { t } = useTranslation();
  const { suggestions, showSuggestions, createFailure, setShowSuggestions, handleAcceptSuggestion } = juntinhos;

  return (
    <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <Sparkles aria-hidden="true" className="w-5 h-5 text-blue-600" />
            {t('juntinhos.suggestions.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {createFailure && (
            <p role="alert" className="text-sm text-red-600">
              {createFailure.message}
            </p>
          )}
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={`${suggestion.title}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-zinc-800 rounded-xl border border-zinc-700"
            >
              <h4 className="font-medium text-zinc-100">{suggestion.title}</h4>
              <p className="text-sm text-zinc-400 mt-1">{suggestion.description}</p>
              {suggestion.child_name && (
                <p className="text-xs text-zinc-500 mt-2">
                  {t('juntinhos.suggestions.forChild', { child: suggestion.child_name })}
                </p>
              )}
              <Button
                size="sm"
                className="w-full mt-3 bg-gradient-to-r from-blue-500 to-amber-500 hover:from-blue-600 hover:to-amber-600 text-white"
                onClick={() => handleAcceptSuggestion(suggestion)}
              >
                {t('juntinhos.suggestions.accept')}
              </Button>
            </motion.div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
