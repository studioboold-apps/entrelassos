/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, Share2, Users } from 'lucide-react';

import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { describeApiFailure } from '@/lib/api-error-message';
import { scoreLabelKey } from '@/lib/boletim-score';
import { buildBoletimShareText } from '@/lib/boletim-share';
import { useTranslation } from '@/lib/i18n';
import { createPageUrl } from '@/utils';

/** Boletim e' conquista: entra na Comunidade nessa categoria. */
const COMMUNITY_CATEGORY = 'conquista';
const COPIED_FEEDBACK_MS = 2500;

/**
 * Pedido do design: compartilhar o boletim "seja dentro da comunidade, ou
 * externamente". Fora: a folha de compartilhar do celular (WhatsApp etc.);
 * no navegador sem ela, o texto vai para a area de transferencia.
 */
export default function BoletimShare({ report, monthLabel }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [hasCopied, setHasCopied] = useState(false);

  const textArgs = { report, monthLabel, scoreLabel: t(scoreLabelKey(report.nota_geral)), t };

  const publishMutation = useMutation({
    mutationFn: () =>
      api.entities.CommunityPost.create({
        content: buildBoletimShareText({ ...textArgs, withLink: false }),
        category: COMMUNITY_CATEGORY,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      navigate(createPageUrl('Comunidade'));
    },
  });

  async function handleShareOutside() {
    const text = buildBoletimShareText(textArgs);
    if (navigator.share) {
      try {
        await navigator.share({ title: t('boletim.share.title'), text });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), COPIED_FEEDBACK_MS);
    } catch {
      // sem folha e sem area de transferencia nao ha' o que fazer; o botao segue ali
    }
  }

  return (
    <div className="px-6 mb-6 space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={handleShareOutside}
          className="h-12 bg-gradient-to-r from-blue-500 to-amber-500 hover:from-blue-600 hover:to-amber-600 text-white font-medium"
        >
          {hasCopied ? (
            <Check aria-hidden="true" className="w-4 h-4 mr-2" />
          ) : (
            <Share2 aria-hidden="true" className="w-4 h-4 mr-2" />
          )}
          {hasCopied ? t('boletim.share.copied') : t('boletim.share.outside')}
        </Button>
        <Button
          variant="outline"
          onClick={() => publishMutation.mutate()}
          disabled={publishMutation.isPending}
          className="h-12 border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
        >
          {publishMutation.isPending ? (
            <Loader2 aria-hidden="true" className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Users aria-hidden="true" className="w-4 h-4 mr-2 text-blue-600" />
          )}
          {t('boletim.share.community')}
        </Button>
      </div>
      {publishMutation.isError && (
        <p role="alert" className="text-sm text-red-600">
          {describeApiFailure(publishMutation.error).message}
        </p>
      )}
    </div>
  );
}
