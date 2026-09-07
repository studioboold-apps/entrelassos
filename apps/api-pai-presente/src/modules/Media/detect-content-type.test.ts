/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { detectContentType } from './detect-content-type';
import { MEDIA_CONTENT_TYPES } from './media.constant';

function withHeader(header: readonly number[], tail = 64): Uint8Array {
  return new Uint8Array([...header, ...new Array(tail).fill(0x41)]);
}

function ascii(text: string): readonly number[] {
  return Array.from(Buffer.from(text, 'ascii'));
}

const JPEG = withHeader([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const PNG = withHeader([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP = withHeader([...ascii('RIFF'), 0x24, 0x00, 0x00, 0x00, ...ascii('WEBP')]);
const HEIC = withHeader([0x00, 0x00, 0x00, 0x18, ...ascii('ftyp'), ...ascii('heic')]);
const PDF = withHeader(ascii('%PDF-1.4'));

describe('o tipo sai dos bytes, nao da extensao', () => {
  test('JPEG SEM extensao nenhuma e aceito', () => {
    expect(detectContentType(JPEG)).toBe(MEDIA_CONTENT_TYPES.JPEG);
  });

  test('PNG e reconhecido pela assinatura de oito bytes', () => {
    expect(detectContentType(PNG)).toBe(MEDIA_CONTENT_TYPES.PNG);
  });

  /** RIFF sozinho tambem e' audio: sem a segunda marca, WAV entraria como foto. */
  test('WebP exige as DUAS marcas, RIFF e WEBP', () => {
    expect(detectContentType(WEBP)).toBe(MEDIA_CONTENT_TYPES.WEBP);
    expect(detectContentType(withHeader([...ascii('RIFF'), 0x24, 0, 0, 0, ...ascii('WAVE')]))).toBe(
      undefined,
    );
  });

  /** Foto de iPhone chega assim por padrao — e' o caso comum, nao a excecao. */
  test('HEIC do iPhone e reconhecido pela caixa ftyp', () => {
    expect(detectContentType(HEIC)).toBe(MEDIA_CONTENT_TYPES.HEIC);
  });

  test('PDF de exame e reconhecido', () => {
    expect(detectContentType(PDF)).toBe(MEDIA_CONTENT_TYPES.PDF);
  });
});

describe('o que nao se reconhece se RECUSA, e nao se adivinha', () => {
  /**
   * O ataque mais simples que existe aqui: o cliente escolhe o nome e o
   * `Content-Type` do multipart, entao os dois podem dizer `image/jpeg`.
   */
  test('executavel renomeado para .jpg nao passa', () => {
    const windows = withHeader([0x4d, 0x5a, 0x90, 0x00]);
    const macos = withHeader([0xcf, 0xfa, 0xed, 0xfe]);
    const elf = withHeader([0x7f, ...ascii('ELF')]);

    expect(detectContentType(windows)).toBe(undefined);
    expect(detectContentType(macos)).toBe(undefined);
    expect(detectContentType(elf)).toBe(undefined);
  });

  /** SVG e' texto e carrega `<script>`: fora de proposito, nao por esquecimento. */
  test('SVG e recusado mesmo parecendo imagem', () => {
    const svg = new Uint8Array(
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', 'utf8'),
    );

    expect(detectContentType(svg)).toBe(undefined);
  });

  test('arquivo vazio ou menor que a marca nao estoura, so recusa', () => {
    expect(detectContentType(new Uint8Array([]))).toBe(undefined);
    expect(detectContentType(new Uint8Array([0xff, 0xd8]))).toBe(undefined);
  });
});
