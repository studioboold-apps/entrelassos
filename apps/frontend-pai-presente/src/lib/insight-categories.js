/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { Activity, Brain, Heart, Wallet } from 'lucide-react';

/**
 * A mesma lista vivia copiada na Home e na Comunidade (`code-standart.md` §16).
 * Copia concorda ate a primeira edicao: mexer numa cor la deixava as duas telas
 * com paletas diferentes para a mesma categoria.
 *
 * O rotulo NAO mora aqui — e' texto de usuario, e vive em `*.locale.json` (§6).
 * O que mora aqui e' a identidade que o servidor conhece, e o desenho.
 */
export const INSIGHT_CATEGORIES = Object.freeze([
  {
    id: 'comportamento',
    labelKey: 'insights.categories.comportamento',
    icon: Brain,
    gradient: 'from-blue-400/25 to-amber-300/30 border-blue-400/40',
  },
  {
    id: 'sexualidade',
    labelKey: 'insights.categories.sexualidade',
    icon: Heart,
    gradient: 'from-rose-300/30 to-amber-200/40 border-rose-300/50',
  },
  {
    id: 'financeira',
    labelKey: 'insights.categories.financeira',
    icon: Wallet,
    gradient: 'from-amber-300/40 to-amber-100/60 border-amber-400/50',
  },
  {
    id: 'saude',
    labelKey: 'insights.categories.saude',
    icon: Activity,
    gradient: 'from-emerald-300/30 to-amber-100/50 border-emerald-400/40',
  },
]);

/** @param {string | null} categoryId */
export function findInsightCategory(categoryId) {
  return INSIGHT_CATEGORIES.find(({ id }) => id === categoryId);
}
