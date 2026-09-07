/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { CHILD_FILE_KINDS } from './child-files';
import { hasStoredExam, needsExamConsent, shouldShowExamNotice } from './exam-consent';

const PHOTO = { id: 'a', kind: CHILD_FILE_KINDS.PHOTO };
const EXAM = { id: 'b', kind: CHILD_FILE_KINDS.EXAM };

describe('o aviso precede o primeiro exame', () => {
  test('o primeiro exame do filho pede consentimento', () => {
    expect(needsExamConsent({ kind: CHILD_FILE_KINDS.EXAM, files: [PHOTO] })).toBe(true);
  });

  /** Cobrar de novo o que ja foi aceito treina a pessoa a clicar sem ler. */
  test('quem ja tem exame guardado nao e cobrado outra vez', () => {
    expect(needsExamConsent({ kind: CHILD_FILE_KINDS.EXAM, files: [EXAM] })).toBe(false);
  });

  test('aceitar libera o envio na mesma sessao', () => {
    expect(needsExamConsent({ kind: CHILD_FILE_KINDS.EXAM, files: [], hasAccepted: true })).toBe(false);
  });

  /** Foto de aniversario nao e' dado de saude: cobrar ali seria ruido. */
  test('foto nunca pede consentimento', () => {
    expect(needsExamConsent({ kind: CHILD_FILE_KINDS.PHOTO, files: [] })).toBe(false);
  });

  test('sem tipo escolhido, nao ha o que cobrar', () => {
    expect(needsExamConsent()).toBe(false);
  });
});

describe('o texto aparece em todo exame, nao so no primeiro', () => {
  /**
   * O consentimento e' cobrado uma vez; a informacao de que aquilo e' dado de
   * saude vale em toda vez, senao o segundo exame sobe sem ninguem lembrar do
   * que esta guardando.
   */
  test('o aviso segue o tipo exame', () => {
    expect(shouldShowExamNotice(CHILD_FILE_KINDS.EXAM)).toBe(true);
    expect(shouldShowExamNotice(CHILD_FILE_KINDS.PHOTO)).toBe(false);
  });
});

describe('quem manda e o tipo guardado, nao a contagem', () => {
  test('lista vazia nao tem exame', () => {
    expect(hasStoredExam([])).toBe(false);
  });

  test('so foto nao conta como exame', () => {
    expect(hasStoredExam([PHOTO, PHOTO])).toBe(false);
  });

  test('um exame no meio de fotos conta', () => {
    expect(hasStoredExam([PHOTO, EXAM, PHOTO])).toBe(true);
  });
});
