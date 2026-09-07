/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { MEDIA_CONTENT_TYPES } from './media.constant';

type Signature = {
  readonly contentType: string;
  /** Deslocamento onde a marca comeca. HEIC guarda a dela depois do tamanho da caixa. */
  readonly offset: number;
  readonly bytes: readonly number[];
  /** Segunda marca, quando a primeira e' generica (RIFF serve para audio tambem). */
  readonly alsoAt?: { readonly offset: number; readonly bytes: readonly number[] };
};

function ascii(text: string): readonly number[] {
  return Array.from(Buffer.from(text, 'ascii'));
}

/**
 * Marcas em ordem de especificidade. HEIC vem antes de qualquer coisa generica
 * porque a caixa `ftyp` dele e' o que o iPhone produz por padrao — e foto de
 * iPhone e' o caso comum deste produto, nao a excecao.
 */
const SIGNATURES: readonly Signature[] = [
  { contentType: MEDIA_CONTENT_TYPES.JPEG, offset: 0, bytes: [0xff, 0xd8, 0xff] },
  {
    contentType: MEDIA_CONTENT_TYPES.PNG,
    offset: 0,
    bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  {
    contentType: MEDIA_CONTENT_TYPES.WEBP,
    offset: 0,
    bytes: ascii('RIFF'),
    alsoAt: { offset: 8, bytes: ascii('WEBP') },
  },
  { contentType: MEDIA_CONTENT_TYPES.PDF, offset: 0, bytes: ascii('%PDF-') },
];

/** Marcas de HEIC/HEIF. Todas vivem em `ftyp` + rotulo, dentro da mesma caixa. */
const HEIC_BRANDS: readonly string[] = [
  'heic',
  'heix',
  'heim',
  'heis',
  'hevc',
  'hevm',
  'hevs',
  'mif1',
  'msf1',
];

function matchesAt(bytes: Uint8Array, offset: number, expected: readonly number[]): boolean {
  if (bytes.byteLength < offset + expected.length) {
    return false;
  }

  return expected.every((value, index) => bytes[offset + index] === value);
}

function isHeic(bytes: Uint8Array): boolean {
  if (!matchesAt(bytes, 4, ascii('ftyp'))) {
    return false;
  }

  return HEIC_BRANDS.some((brand) => matchesAt(bytes, 8, ascii(brand)));
}

/**
 * O tipo se decide pelos BYTES, nunca pela extensao nem pelo `Content-Type` do
 * multipart: os dois sao texto que o cliente escreve, e `security.md` §3 pede
 * validacao na fronteira — extensao nao e' validacao.
 *
 * Desconhecido devolve `undefined`, e quem chama RECUSA. Nao existe palpite
 * aqui: guardar bytes de tipo que nao sabemos nomear e' guardar o que nao
 * sabemos servir depois.
 *
 * **SVG e' recusado de proposito**, e nao por esquecimento: ele e' texto, nao
 * tem marca de comeco confiavel e carrega `<script>`. Aceita-lo colocaria um
 * arquivo executavel no album do filho.
 */
export function detectContentType(bytes: Uint8Array): string | undefined {
  if (isHeic(bytes)) {
    return MEDIA_CONTENT_TYPES.HEIC;
  }

  const signature = SIGNATURES.find(
    ({ offset, bytes: expected, alsoAt }) =>
      matchesAt(bytes, offset, expected) &&
      (alsoAt === undefined || matchesAt(bytes, alsoAt.offset, alsoAt.bytes)),
  );

  return signature?.contentType;
}
