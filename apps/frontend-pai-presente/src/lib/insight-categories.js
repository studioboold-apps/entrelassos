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
    gradient: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
  },
  {
    id: 'sexualidade',
    labelKey: 'insights.categories.sexualidade',
    icon: Heart,
    gradient: 'from-emerald-400/20 to-teal-400/20 border-emerald-400/30',
  },
  {
    id: 'financeira',
    labelKey: 'insights.categories.financeira',
    icon: Wallet,
    gradient: 'from-blue-400/20 to-sky-400/20 border-blue-400/30',
  },
  {
    id: 'saude',
    labelKey: 'insights.categories.saude',
    icon: Activity,
    gradient: 'from-teal-400/20 to-emerald-400/20 border-teal-400/30',
  },
]);

/** @param {string | null} categoryId */
export function findInsightCategory(categoryId) {
  return INSIGHT_CATEGORIES.find(({ id }) => id === categoryId);
}
