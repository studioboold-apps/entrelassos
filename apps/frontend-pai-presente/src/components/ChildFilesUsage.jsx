/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';
import { HardDrive } from 'lucide-react';

import { CHILD_FILE_FIT, formatByteSize } from '@/lib/child-files';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** A barra fica amarela antes de encher, e nao no instante da recusa. */
const NEARLY_FULL_RATIO = 0.8;

const FIT_MESSAGE_KEYS = Object.freeze({
  [CHILD_FILE_FIT.FILE_TOO_LARGE]: 'perfil.childFiles.usage.fileTooLarge',
  [CHILD_FILE_FIT.CHILD_QUOTA]: 'perfil.childFiles.usage.childQuota',
  [CHILD_FILE_FIT.ACCOUNT_QUOTA]: 'perfil.childFiles.usage.accountQuota',
});

function toPercent({ used_bytes, quota_bytes }) {
  if (quota_bytes === 0) return 0;
  return Math.min(100, Math.round((used_bytes / quota_bytes) * 100));
}

/**
 * A barra sozinha nao diz numero, e o numero sozinho nao diz "quase". Os dois
 * juntos respondem a pergunta que o pai faz de verdade: cabe mais uma foto?
 */
function UsageRow({ label, scope }) {
  const percent = toPercent(scope);
  const isNearlyFull = scope.used_bytes >= scope.quota_bytes * NEARLY_FULL_RATIO;

  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className={cn('tabular-nums', isNearlyFull ? 'text-amber-700' : 'text-zinc-500')}>
          {formatByteSize(scope.used_bytes)} / {formatByteSize(scope.quota_bytes)}
        </span>
      </div>
      <div className="h-1.5 mt-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          role="progressbar"
          aria-label={label}
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{ width: `${percent}%` }}
          className={cn('h-full rounded-full', isNearlyFull ? 'bg-amber-400' : 'bg-emerald-400')}
        />
      </div>
    </div>
  );
}

export default function ChildFilesUsage({ usage, fit, childName }) {
  const { t } = useTranslation();

  if (usage === undefined) return null;

  const fitMessageKey = FIT_MESSAGE_KEYS[fit];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <HardDrive aria-hidden="true" className="w-4 h-4 text-zinc-500" />
        <p className="text-sm text-zinc-300">{t('perfil.childFiles.usage.title')}</p>
      </div>

      <UsageRow label={t('perfil.childFiles.usage.child', { child: childName })} scope={usage.child} />
      <UsageRow label={t('perfil.childFiles.usage.account')} scope={usage.account} />

      <p className="text-xs text-zinc-500">
        {t('perfil.childFiles.usage.fileMax', { size: formatByteSize(usage.file_max_bytes) })}
      </p>

      {fitMessageKey !== undefined && (
        <p role="alert" className="text-sm text-amber-700">
          {t(fitMessageKey, { size: formatByteSize(usage.file_max_bytes) })}
        </p>
      )}
    </div>
  );
}
