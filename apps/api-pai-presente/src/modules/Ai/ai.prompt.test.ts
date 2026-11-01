/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import {
  buildChatPrompt,
  buildReportPrompt,
  buildSuggestionsPrompt,
  MENTOR_SYSTEM_PROMPT,
  WRITING_RULES,
  withFamilyValues,
} from './ai.prompt';
import { summarizeActivities, summarizeInsights } from './ai.summary';

const CHILDREN = [{ name: 'Maria', age: 10, gender: 'feminino' }];

describe('valores da familia no sistema', () => {
  test('sem valores informados, o prompt e o de sempre', () => {
    expect(withFamilyValues('BASE', undefined)).toBe('BASE');
    expect(withFamilyValues('BASE', { religion: null, politics: null, orientation: null })).toBe('BASE');
  });

  test('so o que o pai informou entra, com a regra de respeitar sem julgar', () => {
    const prompt = withFamilyValues('BASE', { religion: 'Espírita', politics: null, orientation: 'Gay' });
    expect(prompt).toContain('Espírita');
    expect(prompt).toContain('Gay');
    expect(prompt).not.toContain('Posicionamento político');
    expect(prompt).toContain('sem julgar');
  });
});

describe('ortografia — o modelo imita a escrita do prompt', () => {
  test('o system prompt do mentor e acentuado e pede acentuacao', () => {
    expect(MENTOR_SYSTEM_PROMPT).toContain('Você é um mentor');
    expect(MENTOR_SYSTEM_PROMPT).toContain(WRITING_RULES);
  });

  test('o prompt do boletim chega acentuado e com a regra de escrita', () => {
    const prompt = buildReportPrompt({
      children: CHILDREN,
      month: '2026-11',
      activities: summarizeActivities([]),
      insights: summarizeInsights([]),
    });
    expect(prompt).toContain('Números do mês');
    expect(prompt).toContain(WRITING_RULES);
    expect(prompt).not.toContain('Numeros do mes');
  });
});

describe('conversa — resposta curta primeiro', () => {
  test('o prompt da conversa pede resumo e no maximo 4 topicos', () => {
    const prompt = buildChatPrompt({ children: CHILDREN, message: 'como ajudo?' });
    expect(prompt).toContain('no máximo 4 tópicos');
    expect(prompt.endsWith('Pergunta do pai: como ajudo?')).toBe(true);
  });
});

describe('sugestoes da regiao', () => {
  test('com cidade, pede passeios reais da regiao e proibe evento inventado', () => {
    const prompt = buildSuggestionsPrompt({ children: CHILDREN, month: '2026-11', city: 'Campinas, SP' });
    expect(prompt).toContain('O pai mora em Campinas, SP');
    expect(prompt).toContain('Não invente eventos com data marcada');
  });

  test('sem cidade, o prompt fica como antes', () => {
    const prompt = buildSuggestionsPrompt({ children: CHILDREN, month: '2026-11' });
    expect(prompt).not.toContain('mora em');
  });
});
