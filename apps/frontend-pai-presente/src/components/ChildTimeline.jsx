/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';
import { CalendarCheck, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ACTIVITY_CATEGORIES } from '@/lib/activity-categories';
import { findChildFileKind, formatByteSize } from '@/lib/child-files';
import { TIMELINE_ENTRY_KINDS } from '@/lib/child-timeline';
import { toLocalDate } from '@/lib/calendar-date';
import { useTranslation } from '@/lib/i18n';

const ICON_CLASS = 'w-4 h-4 text-zinc-500 shrink-0';
const ROW_CLASS = 'flex items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2';

function findActivityCategory(category) {
  return ACTIVITY_CATEGORIES.find((candidate) => candidate.id === category);
}

/**
 * O dia sai pelo relogio de quem esta olhando, e nao por um formato cravado no
 * codigo: `2026-09-05` e' o que o banco guarda, nao o que se le.
 */
function formatDay(day, fallback) {
  const date = toLocalDate(day);
  return date === undefined ? fallback : date.toLocaleDateString();
}

/**
 * Desenha e nada mais (`web.md` §4). A ordem chega pronta do
 * `buildChildTimeline`, que repete a conta do `CHILD_FILE_TIMELINE_ORDER` da
 * API — foto, exame e atividade num unico fio de datas, porque o pai lembra do
 * mes, nao de em qual aba a coisa foi guardada.
 */
export default function ChildTimeline({ entries, onRemoveFile }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const isFile = entry.entryKind === TIMELINE_ENTRY_KINDS.FILE;
        const kindOption = isFile ? findChildFileKind(entry.item.kind) : undefined;
        const category = isFile ? undefined : findActivityCategory(entry.item.category);
        const day = formatDay(entry.day, t('perfil.childFiles.noDate'));

        return (
          <div key={entry.key} className={ROW_CLASS}>
            {kindOption === undefined ? (
              <CalendarCheck aria-hidden="true" className={ICON_CLASS} />
            ) : (
              <kindOption.icon aria-hidden="true" className={ICON_CLASS} />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white truncate">
                {isFile ? (entry.item.caption ?? t(kindOption.labelKey)) : entry.item.title}
              </p>
              <p className="text-xs text-zinc-500">
                {isFile
                  ? t('perfil.childFiles.rowMeta', {
                      kind: t(kindOption.labelKey),
                      date: day,
                      size: formatByteSize(entry.item.byte_size),
                    })
                  : t('perfil.childFiles.activityMeta', {
                      kind: category === undefined ? t('perfil.childFiles.kinds.activity') : t(category.labelKey),
                      date: day,
                    })}
              </p>
            </div>
            {isFile && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('perfil.childFiles.remove')}
                onClick={() => onRemoveFile(entry.item.id)}
                className="text-zinc-500 hover:text-red-400 shrink-0"
              >
                <Trash2 aria-hidden="true" className="w-4 h-4" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
