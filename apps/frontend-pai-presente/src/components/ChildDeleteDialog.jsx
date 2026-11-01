/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';
import { Trash2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTranslation } from '@/lib/i18n';

/**
 * Apagar filho e' irreversivel e leva junto sete campos que o pai digitou um
 * por um. Disparava no toque, sem pergunta: um encostao na lista e o cadastro
 * sumia sem nem um aviso na tela.
 */
export default function ChildDeleteDialog({ perfil }) {
  const { t } = useTranslation();
  const { childToDelete, setChildToDelete, handleConfirmDelete } = perfil;

  return (
    <AlertDialog open={childToDelete !== null} onOpenChange={(open) => { if (!open) setChildToDelete(null); }}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-zinc-100">
            {t('perfil.deleteDialog.title', { child: childToDelete?.name })}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            {t('perfil.deleteDialog.body')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            {t('perfil.deleteDialog.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700" onClick={handleConfirmDelete}>
            <Trash2 aria-hidden="true" className="w-4 h-4 mr-2" />
            {t('perfil.deleteDialog.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
