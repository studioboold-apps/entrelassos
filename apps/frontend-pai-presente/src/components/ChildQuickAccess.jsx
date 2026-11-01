/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { api } from '@/api/client';
import PersonAvatar from '@/components/PersonAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CHILD_LINK_PARAM } from '@/lib/child-from-link';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';

/** Quantos rostos cabem empilhados no topo antes do "+N". */
const STACKED_AVATARS = 2;

/**
 * Feedback do design: "no topo a direita um acesso rapido ao filho, com um
 * avatarzinho". Um filho so': o toque abre a ficha dele. Mais de um: abre a
 * lista, e cada nome leva a ficha daquele filho.
 */
export default function ChildQuickAccess({ className }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: children = [] } = useQuery({ queryKey: ['children'], queryFn: () => api.entities.Child.list() });

  if (children.length === 0) return null;

  const openChild = (child) => navigate(`${createPageUrl('Perfil')}?${CHILD_LINK_PARAM}=${child.id}`);
  const stacked = children.slice(0, STACKED_AVATARS);
  const hiddenCount = children.length - stacked.length;

  const avatars = (
    <span className="flex items-center -space-x-3">
      {stacked.map((child) => (
        <PersonAvatar key={child.id} name={child.name} src={child.avatar_url} size="md" className="shadow-sm" />
      ))}
      {hiddenCount > 0 && (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white ring-2 ring-white">
          +{hiddenCount}
        </span>
      )}
    </span>
  );

  if (children.length === 1) {
    const [child] = children;
    return (
      <button
        type="button"
        onClick={() => openChild(child)}
        aria-label={t('profile.quickAccess.open', { name: child.name })}
        className={cn('ml-auto rounded-full transition-transform active:scale-95', className)}
      >
        {avatars}
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('profile.quickAccess.label')}
        className={cn('ml-auto rounded-full transition-transform active:scale-95 focus:outline-none', className)}
      >
        {avatars}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800">
        <DropdownMenuLabel className="text-zinc-500">{t('profile.quickAccess.title')}</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-800" />
        {children.map((child) => (
          <DropdownMenuItem key={child.id} onSelect={() => openChild(child)} className="gap-3 py-2 text-zinc-100">
            <PersonAvatar name={child.name} src={child.avatar_url} size="xs" />
            <span className="truncate">{child.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
