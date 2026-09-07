/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';
import { Loader2, ShieldCheck, Upload } from 'lucide-react';

import ChildTimeline from '@/components/ChildTimeline';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CHILD_FILE_ACCEPT, CHILD_FILE_KIND_OPTIONS } from '@/lib/child-files';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

import { useChildFiles } from './ChildFilesPanel.hook';

const INPUT_CLASS = 'mt-1.5 h-11 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600';


export default function ChildFilesPanel({ child }) {
  const { t } = useTranslation();
  const {
    timeline,
    isLoadingTimeline,
    listFailure,
    uploadFailure,
    removeFailure,
    form,
    fileName,
    isUploading,
    showsExamNotice,
    isExamConsentPending,
    isGrantingConsent,
    consentFailure,
    canUpload,
    handleKindChange,
    handleAcceptExamNotice,
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
          {CHILD_FILE_KIND_OPTIONS.map((option) => (
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

      {showsExamNotice && (
        <div className="bg-zinc-900 border border-amber-500/40 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <ShieldCheck aria-hidden="true" className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-white">{t('perfil.childFiles.examNotice.title')}</p>
              <p className="text-xs text-zinc-400 mt-1">{t('perfil.childFiles.examNotice.body')}</p>
            </div>
          </div>

          {isExamConsentPending ? (
            <div className="flex items-start gap-2">
              <Checkbox
                id="exam-consent"
                checked={false}
                disabled={isGrantingConsent}
                onCheckedChange={(isChecked) => handleAcceptExamNotice(isChecked === true)}
                className="mt-0.5"
              />
              <Label htmlFor="exam-consent" className="text-xs text-zinc-300 leading-snug">
                {t('perfil.childFiles.examNotice.consent')}
              </Label>
            </div>
          ) : (
            <p className="text-xs text-zinc-500">{t('perfil.childFiles.examNotice.reminder')}</p>
          )}

          {consentFailure && (
            <p role="alert" className="text-sm text-red-400">
              {consentFailure.message}
            </p>
          )}
        </div>
      )}

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

        {isLoadingTimeline && <p className="text-sm text-zinc-500">{t('perfil.childFiles.loading')}</p>}

        {!isLoadingTimeline && timeline.length === 0 && !listFailure && (
          <p className="text-sm text-zinc-500">{t('perfil.childFiles.empty')}</p>
        )}

        <ChildTimeline entries={timeline} onRemoveFile={handleRemove} />
      </div>
    </div>
  );
}
