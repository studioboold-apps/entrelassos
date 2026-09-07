/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';
import { FileText, ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CHILD_FILE_ACCEPT, CHILD_FILE_KINDS, formatByteSize } from '@/lib/child-files';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

import { useChildFiles } from './ChildFilesPanel.hook';

const INPUT_CLASS = 'mt-1.5 h-11 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600';

/**
 * A chave do rotulo e' LITERAL em cada opcao, e nao montada com
 * `perfil.childFiles.kinds.${kind}`: a varredura de `i18n-keys.test.js` le
 * texto, entao chave montada em tempo de execucao nao e' conferida por ninguem
 * e o idioma novo nasce faltando a linha.
 */
const KIND_OPTIONS = Object.freeze([
  { kind: CHILD_FILE_KINDS.PHOTO, icon: ImagePlus, labelKey: 'perfil.childFiles.kinds.photo' },
  { kind: CHILD_FILE_KINDS.EXAM, icon: FileText, labelKey: 'perfil.childFiles.kinds.exam' },
]);

function findKindOption(kind) {
  return KIND_OPTIONS.find((option) => option.kind === kind);
}

export default function ChildFilesPanel({ child }) {
  const { t } = useTranslation();
  const {
    files,
    isLoadingFiles,
    listFailure,
    uploadFailure,
    removeFailure,
    form,
    fileName,
    isUploading,
    canUpload,
    handleKindChange,
    handleFieldChange,
    handleFileChange,
    handleUpload,
    handleRemove,
  } = useChildFiles({ child });

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-zinc-400">{t('perfil.childFiles.kindLabel')}</Label>
        <div className="grid grid-cols-2 gap-2 mt-1.5">
          {KIND_OPTIONS.map((option) => (
            <button
              key={option.kind}
              type="button"
              onClick={() => handleKindChange(option.kind)}
              className={cn(
                'flex items-center justify-center gap-2 h-11 rounded-xl border text-sm transition-colors',
                form.kind === option.kind
                  ? 'bg-gradient-to-r from-blue-500 to-emerald-400 border-transparent text-white'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200',
              )}
            >
              <option.icon aria-hidden="true" className="w-4 h-4" />
              {t(option.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-zinc-400" htmlFor="child-file-input">
          {t('perfil.childFiles.fileLabel')}
        </Label>
        <Input
          id="child-file-input"
          type="file"
          accept={CHILD_FILE_ACCEPT[form.kind]}
          onChange={handleFileChange}
          className={INPUT_CLASS}
        />
        {fileName !== '' && (
          <p className="text-xs text-zinc-500 mt-1.5">{t('perfil.childFiles.chosen', { file: fileName })}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-zinc-400">{t('perfil.childFiles.captionLabel')}</Label>
          <Input
            value={form.caption}
            placeholder={t('perfil.childFiles.captionPlaceholder')}
            onChange={(event) => handleFieldChange('caption', event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <Label className="text-zinc-400">{t('perfil.childFiles.takenOnLabel')}</Label>
          <Input
            type="date"
            value={form.takenOn}
            onChange={(event) => handleFieldChange('takenOn', event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <Button
        onClick={handleUpload}
        disabled={!canUpload}
        className="w-full h-12 bg-gradient-to-r from-blue-500 to-emerald-400 hover:from-blue-600 hover:to-emerald-500 text-white font-medium"
      >
        {isUploading ? (
          <>
            <Loader2 aria-hidden="true" className="w-4 h-4 mr-2 animate-spin" />
            {t('perfil.childFiles.uploading')}
          </>
        ) : (
          <>
            <Upload aria-hidden="true" className="w-4 h-4 mr-2" />
            {t('perfil.childFiles.upload')}
          </>
        )}
      </Button>

      {uploadFailure && (
        <p role="alert" className="text-sm text-red-400">
          {uploadFailure.message}
        </p>
      )}

      <div className="space-y-2 border-t border-zinc-800 pt-4">
        <h3 className="text-sm font-medium text-zinc-400">
          {t('perfil.childFiles.listTitle', { child: child.name })}
        </h3>

        {listFailure && (
          <p role="alert" className="text-sm text-red-400">
            {listFailure.message}
          </p>
        )}

        {removeFailure && (
          <p role="alert" className="text-sm text-red-400">
            {removeFailure.message}
          </p>
        )}

        {isLoadingFiles && <p className="text-sm text-zinc-500">{t('perfil.childFiles.loading')}</p>}

        {!isLoadingFiles && files.length === 0 && !listFailure && (
          <p className="text-sm text-zinc-500">{t('perfil.childFiles.empty')}</p>
        )}

        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2"
          >
            <div className="min-w-0">
              <p className="text-sm text-white truncate">
                {file.caption ?? t(findKindOption(file.kind).labelKey)}
              </p>
              <p className="text-xs text-zinc-500">
                {t('perfil.childFiles.rowMeta', {
                  kind: t(findKindOption(file.kind).labelKey),
                  date: file.taken_on ?? t('perfil.childFiles.noDate'),
                  size: formatByteSize(file.byte_size),
                })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('perfil.childFiles.remove')}
              onClick={() => handleRemove(file.id)}
              className="text-zinc-500 hover:text-red-400 shrink-0"
            >
              <Trash2 aria-hidden="true" className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
