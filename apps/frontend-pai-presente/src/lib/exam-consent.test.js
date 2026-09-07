/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { CHILD_FILE_KINDS } from './child-files';
import {
  CHILD_CONSENT_PURPOSES,
  hasHealthDataConsent,
  needsExamConsent,
  shouldShowExamNotice,
} from './exam-consent';

const HEALTH = [{ purpose: CHILD_CONSENT_PURPOSES.HEALTH_DATA }];

describe('a finalidade e a MESMA palavra que a API grava', () => {
  /**
   * Medido: `child-consent.constant.ts` grava `dado_de_saude`, e o `POST` valida
   * contra uma lista fechada. Uma letra diferente aqui produz 400 na concessao,
   * e o pai leria "nao conseguimos salvar" sobre um consentimento que ele acabou
   * de dar.
   */
  test('a finalidade e o texto estavel do art. 14 §1', () => {
    expect(CHILD_CONSENT_PURPOSES.HEALTH_DATA).toBe('dado_de_saude');
  });
});

describe('quem responde se ha consentimento e o SERVIDOR', () => {
  /**
   * O defeito que este teste trava: o `H5.3` decidia por "este filho ja tem
   * exame guardado", que e' um PALPITE sobre o servidor. O primeiro exame nunca
   * subia — a caixa liberava o botao, e a API recusava com 403
   * `CHILD_EXAM_CONSENT_MISSING`, porque nenhuma linha de consentimento havia
   * sido escrita.
   */
  test('sem consentimento registrado, o exame continua barrado', () => {
    expect(needsExamConsent({ kind: CHILD_FILE_KINDS.EXAM, consents: [] })).toBe(true);
  });

  test('com o consentimento registrado, o exame passa', () => {
    expect(needsExamConsent({ kind: CHILD_FILE_KINDS.EXAM, consents: HEALTH })).toBe(false);
  });

  /** Consentimento de outra finalidade nao libera dado de saude (art. 14 §1: ESPECIFICO). */
  test('consentimento de outra finalidade nao serve', () => {
    expect(needsExamConsent({ kind: CHILD_FILE_KINDS.EXAM, consents: [{ purpose: 'outra' }] })).toBe(
      true,
    );
  });

  test('a foto nunca pede consentimento especifico', () => {
    expect(needsExamConsent({ kind: CHILD_FILE_KINDS.PHOTO, consents: [] })).toBe(false);
  });

  /** Sem tipo escolhido nao ha o que barrar, e barrar por omissao travaria a foto. */
  test('sem argumento nenhum, nada e barrado', () => {
    expect(needsExamConsent()).toBe(false);
  });
});

describe('o AVISO e a COBRANCA sao coisas diferentes', () => {
  /**
   * O texto aparece em todo exame, inclusive no decimo: quem guarda exame do
   * filho tem de continuar lendo que aquilo e' dado de saude cifrado. A caixa de
   * aceite e' que sai de cena depois do primeiro.
   */
  test('o texto acompanha o tipo exame', () => {
    expect(shouldShowExamNotice(CHILD_FILE_KINDS.EXAM)).toBe(true);
    expect(shouldShowExamNotice(CHILD_FILE_KINDS.PHOTO)).toBe(false);
  });
});

describe('hasHealthDataConsent le a lista da API', () => {
  test('lista vazia nao tem consentimento', () => {
    expect(hasHealthDataConsent([])).toBe(false);
  });

  test('acha a finalidade no meio de outras', () => {
    expect(hasHealthDataConsent([{ purpose: 'outra' }, ...HEALTH])).toBe(true);
  });
});
