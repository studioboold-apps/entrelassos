/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ACTIVITY_CATEGORIES } from '@/lib/activity-categories';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const FIELD_CLASS = 'mt-1.5 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600';

/**
 * Fatia da tela de Juntinhos: recebe o retorno do hook, nao props soltas.
 *
 * @param {{ juntinhos: ReturnType<import('@/pages/Juntinhos.hook').useJuntinhos> }} props
 */
export default function NewActivityDialog({ juntinhos }) {
  const { t } = useTranslation();
  const {
    newActivity,
    children,
    showNewActivity,
    createFailure,
    isCreating,
    canCreate,
    setShowNewActivity,
    handleActivityFieldChange,
    handleCreateActivity,
  } = juntinhos;

  return (
    <Dialog open={showNewActivity} onOpenChange={setShowNewActivity}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-white">{t('juntinhos.newActivity')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-zinc-400">{t('juntinhos.form.titleLabel')}</Label>
            <Input
              value={newActivity.title}
              onChange={(event) => handleActivityFieldChange('title', event.target.value)}
              placeholder={t('juntinhos.form.titlePlaceholder')}
              className={FIELD_CLASS}
            />
          </div>

          <div>
            <Label className="text-zinc-400">{t('juntinhos.form.descriptionLabel')}</Label>
            <Textarea
              value={newActivity.description}
              onChange={(event) => handleActivityFieldChange('description', event.target.value)}
              placeholder={t('juntinhos.form.descriptionPlaceholder')}
              className={FIELD_CLASS}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-zinc-400">{t('juntinhos.form.dateLabel')}</Label>
              <Input
                type="date"
                value={newActivity.date}
                onChange={(event) => handleActivityFieldChange('date', event.target.value)}
                className={FIELD_CLASS}
              />
            </div>
            <div>
              <Label className="text-zinc-400">{t('juntinhos.form.timeLabel')}</Label>
              <Input
                type="time"
                value={newActivity.time}
                onChange={(event) => handleActivityFieldChange('time', event.target.value)}
                className={FIELD_CLASS}
              />
            </div>
          </div>

          <div>
            <Label className="text-zinc-400">{t('juntinhos.form.childLabel')}</Label>
            <Select value={newActivity.child_id} onValueChange={(value) => handleActivityFieldChange('child_id', value)}>
              <SelectTrigger className={FIELD_CLASS}>
                <SelectValue placeholder={t('juntinhos.form.childPlaceholder')} />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-zinc-400">{t('juntinhos.form.categoryLabel')}</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {ACTIVITY_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleActivityFieldChange('category', category.id)}
                  className={cn(
                    'p-3 rounded-xl flex flex-col items-center gap-1 transition-all',
                    newActivity.category === category.id
                      ? 'bg-gradient-to-r from-blue-500 to-emerald-400 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700',
                  )}
                >
                  <category.icon aria-hidden="true" className="w-5 h-5" />
                  <span className="text-[10px]">{t(category.labelKey)}</span>
                </button>
              ))}
            </div>
          </div>

          {createFailure && (
            <p role="alert" className="text-sm text-red-400">
              {createFailure.message}
            </p>
          )}

          <Button
            className="w-full bg-gradient-to-r from-blue-500 to-emerald-400 hover:from-blue-600 hover:to-emerald-500 text-white"
            onClick={handleCreateActivity}
            disabled={!canCreate || isCreating}
          >
            {isCreating ? t('juntinhos.form.saving') : t('juntinhos.form.submit')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
