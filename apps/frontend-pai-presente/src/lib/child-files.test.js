/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { CHILD_FILE_ACCEPT, CHILD_FILE_KINDS, formatByteSize } from './child-files';

describe('o tamanho e dito na unidade que o pai le', () => {
  test('bytes crus viram kB e MB', () => {
    expect(formatByteSize(512)).toBe('512 B');
    expect(formatByteSize(2048)).toBe('2.0 kB');
    expect(formatByteSize(3_512_904)).toBe('3.4 MB');
  });

  /**
   * A lista desenha o tamanho de toda linha. Arquivo sem `byte_size` — vista
   * antiga, resposta truncada — pintaria "NaN undefined" no lugar do numero.
   */
  test('valor ausente nao pinta NaN na tela', () => {
    expect(formatByteSize(undefined)).toBe('');
    expect(formatByteSize(Number.NaN)).toBe('');
  });
});

describe('o seletor de arquivo ja abre filtrado', () => {
  /**
   * O `accept` e' dica, nao regra: quem decide e' a API, que compara o tipo
   * real dos bytes. Ele existe para o pai nao ter de procurar a foto no meio
   * dos PDFs.
   */
  test('foto nao oferece PDF', () => {
    expect(CHILD_FILE_ACCEPT[CHILD_FILE_KINDS.PHOTO]).not.toContain('application/pdf');
  });

  /**
   * Exame aceita imagem TAMBEM: o caso comum nao e' o laboratorio mandando
   * PDF, e' o pai fotografando o papel com o celular.
   */
  test('exame oferece PDF e imagem', () => {
    expect(CHILD_FILE_ACCEPT[CHILD_FILE_KINDS.EXAM]).toContain('application/pdf');
    expect(CHILD_FILE_ACCEPT[CHILD_FILE_KINDS.EXAM]).toContain('image/jpeg');
  });

  /** HEIC e' o padrao do iPhone: de fora, metade das fotos nem aparece. */
  test('a foto do iPhone entra', () => {
    expect(CHILD_FILE_ACCEPT[CHILD_FILE_KINDS.PHOTO]).toContain('image/heic');
  });
});
