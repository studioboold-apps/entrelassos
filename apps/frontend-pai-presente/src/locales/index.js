/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import activityCard from '@/components/ActivityCard.locale.json';
import insightCard from '@/components/InsightCard.locale.json';
import boletim from '@/pages/Boletim.locale.json';
import chat from '@/pages/Chat.locale.json';
import comunidade from '@/pages/Comunidade.locale.json';
import home from '@/pages/Home.locale.json';
import juntinhos from '@/pages/Juntinhos.locale.json';
import onboarding from '@/pages/Onboarding.locale.json';
import perfil from '@/pages/Perfil.locale.json';

import activities from './activities.locale.json';
import common from './common.locale.json';
import insights from './insights.locale.json';
import profile from './profile.locale.json';

/**
 * O escopo NAO se repete dentro do arquivo: `Boletim.locale.json` guarda
 * `score.excellent`, e o prefixo `boletim.` nasce aqui. Escrever o escopo nos
 * dois lugares e' a mesma palavra em duas fontes — divergem na primeira edicao,
 * e a chave que some vira o proprio texto na tela sem nada quebrar.
 *
 * Escopo compartilhado mora nesta pasta; escopo de uma tela so mora ao lado
 * dela, para nascer e morrer junto com a tela.
 */
export const LOCALE_MESSAGES = Object.freeze({
  activities,
  activityCard,
  boletim,
  chat,
  common,
  comunidade,
  home,
  insightCard,
  insights,
  juntinhos,
  onboarding,
  perfil,
  profile,
});
