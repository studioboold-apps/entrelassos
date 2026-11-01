/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';

import ChildFields from '@/components/ChildFields';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from '@/lib/i18n';

/** Fatia da tela de perfil: recebe o retorno do hook, nao props soltas. */
export default function ChildEditDialog({ perfil }) {
  const { t } = useTranslation();
  const {
    isChildDialogOpen,
    editingChild,
    childForm,
    childFailure,
    isSavingChild,
    canSaveChild,
    handleCloseChildDialog,
    handleChildFieldChange,
    handleSaveChild,
  } = perfil;

  return (
    <Dialog open={isChildDialogOpen} onOpenChange={(open) => { if (!open) handleCloseChildDialog(); }}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">
            {editingChild ? t('perfil.childDialog.editTitle') : t('perfil.childDialog.addTitle')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <ChildFields value={childForm} onFieldChange={handleChildFieldChange} />

          {childFailure && (
            <p role="alert" className="text-sm text-red-600">
              {childFailure.message}
            </p>
          )}

          <Button
            className="w-full bg-gradient-to-r from-blue-500 to-amber-500 hover:from-blue-600 hover:to-amber-600 text-white"
            onClick={handleSaveChild}
            disabled={!canSaveChild || isSavingChild}
          >
            {isSavingChild ? t('perfil.saving') : t('perfil.save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
