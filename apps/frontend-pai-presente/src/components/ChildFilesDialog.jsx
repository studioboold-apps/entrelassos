/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';

import ChildFilesPanel from '@/components/ChildFilesPanel';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from '@/lib/i18n';

/**
 * O painel so' e' montado quando ha filho escolhido, e nao apenas escondido:
 * ele guarda tipo, legenda e data em estado, e mantido montado a legenda do
 * filho anterior reapareceria na ficha do proximo — arquivo do irmao errado
 * legendado com a frase do irmao certo.
 */
export default function ChildFilesDialog({ child, onClose }) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={child !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="bg-zinc-900 border-zinc-800 max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="text-white">
            {t('perfil.childFiles.title', { child: child?.name })}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {t('perfil.childFiles.subtitle')}
          </DialogDescription>
        </DialogHeader>
        {child !== null && <ChildFilesPanel child={child} />}
      </DialogContent>
    </Dialog>
  );
}
