/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { BookOpen, ChefHat, Dumbbell, Gamepad2, GraduationCap, Palette, School, Tent, TreePine, Wrench } from 'lucide-react';

/**
 * As dez categorias de atividade moravam soltas dentro da tela, com o rotulo
 * cravado em portugues no meio do JSX (`web.md` §6). A identidade que o servidor
 * grava e' o `id`; o rotulo e' texto de usuario e vive em `*.locale.json`.
 *
 * Mesmo desenho de `insight-categories.js` de proposito: quem aprender um
 * aprende o outro.
 */
export const ACTIVITY_CATEGORIES = Object.freeze([
  { id: 'aventura', labelKey: 'activities.categories.aventura', icon: Tent },
  { id: 'educativa', labelKey: 'activities.categories.educativa', icon: BookOpen },
  { id: 'esportiva', labelKey: 'activities.categories.esportiva', icon: Dumbbell },
  { id: 'criativa', labelKey: 'activities.categories.criativa', icon: Palette },
  { id: 'natureza', labelKey: 'activities.categories.natureza', icon: TreePine },
  { id: 'culinaria', labelKey: 'activities.categories.culinaria', icon: ChefHat },
  { id: 'jogos', labelKey: 'activities.categories.jogos', icon: Gamepad2 },
  { id: 'escolar', labelKey: 'activities.categories.escolar', icon: School },
  { id: 'cursos', labelKey: 'activities.categories.cursos', icon: GraduationCap },
  { id: 'oficinas', labelKey: 'activities.categories.oficinas', icon: Wrench },
]);
