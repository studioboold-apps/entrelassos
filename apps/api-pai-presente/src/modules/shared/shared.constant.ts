/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

export const ACTIVITY_CATEGORIES = [
  'aventura',
  'educativa',
  'esportiva',
  'criativa',
  'natureza',
  'culinaria',
  'jogos',
  'escolar',
  'cursos',
  'oficinas',
] as const;
export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export const CHILD_GENDERS = ['masculino', 'feminino', 'outro'] as const;
export type ChildGender = (typeof CHILD_GENDERS)[number];

export const MARITAL_STATUSES = [
  'solteiro',
  'casado',
  'divorciado',
  'viuvo',
  'uniao_estavel',
] as const;
export type MaritalStatus = (typeof MARITAL_STATUSES)[number];

export const COMMUNITY_POST_CATEGORIES = [
  'experiencia',
  'dica',
  'duvida',
  'conquista',
] as const;
export type CommunityPostCategory = (typeof COMMUNITY_POST_CATEGORIES)[number];

export const INSIGHT_CATEGORIES = [
  'comportamento',
  'sexualidade',
  'financeira',
  'saude',
] as const;
export type InsightCategory = (typeof INSIGHT_CATEGORIES)[number];

export const CHAT_ROLES = ['user', 'assistant'] as const;
export type ChatRole = (typeof CHAT_ROLES)[number];

/** Teto de VARCHAR para valor de dominio fechado; ENUM nativo e proibido. */
export const DOMAIN_VALUE_LENGTH = 32;
export const SHORT_TEXT_LENGTH = 120;
export const MEDIUM_TEXT_LENGTH = 255;
