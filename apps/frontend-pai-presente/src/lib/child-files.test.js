/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import {
  CHILD_FILE_ACCEPT,
  CHILD_FILE_FIT,
  CHILD_FILE_KINDS,
  checkChildFileFit,
  formatByteSize,
} from './child-files';

describe('o tamanho e dito na unidade que o pai le', () => {
  test('bytes crus viram kB e MB', () => {
    expect(formatByteSize(512)).toBe('512 B');
    expect(formatByteSize(2048)).toBe('2.0 kB');
    expect(formatByteSize(3_512_904)).toBe('3.4 MB');
  });

  /** O teto da conta e' de 2 GiB: sem `GB` a barra imprimiria "2048.0 MB". */
  test('o teto da conta se le em GB, e nao em milhares de MB', () => {
    expect(formatByteSize(2 * 1024 * 1024 * 1024)).toBe('2.0 GB');
    expect(formatByteSize(500 * 1024 * 1024)).toBe('500.0 MB');
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

const MIB = 1024 * 1024;

function buildUsage({ childRemaining, accountRemaining, fileMax = 15 * MIB }) {
  return {
    fileMaxBytes: fileMax,
    child: { usedBytes: 0, quotaBytes: 500 * MIB, remainingBytes: childRemaining },
    account: { usedBytes: 0, quotaBytes: 2048 * MIB, remainingBytes: accountRemaining },
  };
}

describe('o arquivo que nao cabe e recusado ANTES de subir', () => {
  /**
   * A API decide de verdade. A tela repete a conta so' para nao gastar a espera
   * do pai e a saida de rede da conta pelo mesmo "nao".
   */
  test('arquivo dentro de tudo cabe', () => {
    const fit = checkChildFileFit({
      file: { size: MIB },
      usage: buildUsage({ childRemaining: 100 * MIB, accountRemaining: 100 * MIB }),
    });

    expect(fit).toBe(CHILD_FILE_FIT.OK);
  });

  test('arquivo acima do teto por arquivo e recusado pelo tamanho dele', () => {
    const fit = checkChildFileFit({
      file: { size: 16 * MIB },
      usage: buildUsage({ childRemaining: 400 * MIB, accountRemaining: 400 * MIB }),
    });

    expect(fit).toBe(CHILD_FILE_FIT.FILE_TOO_LARGE);
  });

  /** O album do filho encheu, e a conta ainda tem espaco: a frase e' outra. */
  test('album do filho cheio se distingue de conta cheia', () => {
    const fit = checkChildFileFit({
      file: { size: 5 * MIB },
      usage: buildUsage({ childRemaining: MIB, accountRemaining: 900 * MIB }),
    });

    expect(fit).toBe(CHILD_FILE_FIT.CHILD_QUOTA);
  });

  test('conta cheia recusa mesmo com o album do filho vazio', () => {
    const fit = checkChildFileFit({
      file: { size: 5 * MIB },
      usage: buildUsage({ childRemaining: 500 * MIB, accountRemaining: MIB }),
    });

    expect(fit).toBe(CHILD_FILE_FIT.ACCOUNT_QUOTA);
  });

  /**
   * Cota que exatamente cabe CABE: recusar no limite deixaria o ultimo byte da
   * cota inalcancavel — o mesmo criterio da API.
   */
  test('encher a cota exatamente ainda cabe', () => {
    const fit = checkChildFileFit({
      file: { size: 5 * MIB },
      usage: buildUsage({ childRemaining: 5 * MIB, accountRemaining: 5 * MIB }),
    });

    expect(fit).toBe(CHILD_FILE_FIT.OK);
  });

  /**
   * Sem medicao ainda, ou sem arquivo escolhido, nao ha' recusa a mostrar: um
   * `undefined` aqui travaria o botao antes de o pai fazer nada errado.
   */
  test('sem medicao e sem arquivo, nada e recusado', () => {
    expect(checkChildFileFit({ file: null, usage: buildUsage({ childRemaining: 0, accountRemaining: 0 }) })).toBe(
      CHILD_FILE_FIT.OK,
    );
    expect(checkChildFileFit({ file: { size: MIB }, usage: undefined })).toBe(CHILD_FILE_FIT.OK);
  });
});
