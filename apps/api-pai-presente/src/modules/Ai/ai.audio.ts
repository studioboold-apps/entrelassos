/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/**
 * Formato de audio que o transcritor aceita, com a extensao que ele usa para
 * reconhecer o formato — o provedor decide pelo NOME do arquivo, entao o nome
 * sai daqui, dos bytes, e nunca do que o cliente escreveu.
 */
export type AudioFormat = {
  readonly contentType: string;
  readonly extension: string;
};

const FORMATS = {
  WEBM: { contentType: 'audio/webm', extension: 'webm' },
  MP4: { contentType: 'audio/mp4', extension: 'm4a' },
  OGG: { contentType: 'audio/ogg', extension: 'ogg' },
  WAV: { contentType: 'audio/wav', extension: 'wav' },
  MP3: { contentType: 'audio/mpeg', extension: 'mp3' },
} as const satisfies Record<string, AudioFormat>;

function matchesAt(bytes: Uint8Array, offset: number, expected: readonly number[]): boolean {
  if (bytes.length < offset + expected.length) return false;
  return expected.every((value, index) => bytes[offset + index] === value);
}

function ascii(text: string): readonly number[] {
  return Array.from(text, (character) => character.charCodeAt(0));
}

/**
 * O que o navegador grava: Chrome e Android saem em WebM/Opus, Safari e iPhone
 * em MP4/AAC. Os outros entram porque o pai pode escolher um arquivo pronto.
 * Desconhecido devolve `undefined`, e quem chama recusa.
 */
export function detectAudioFormat(bytes: Uint8Array): AudioFormat | undefined {
  if (matchesAt(bytes, 0, [0x1a, 0x45, 0xdf, 0xa3])) return FORMATS.WEBM;
  if (matchesAt(bytes, 4, ascii('ftyp'))) return FORMATS.MP4;
  if (matchesAt(bytes, 0, ascii('OggS'))) return FORMATS.OGG;
  if (matchesAt(bytes, 0, ascii('RIFF')) && matchesAt(bytes, 8, ascii('WAVE'))) return FORMATS.WAV;
  if (matchesAt(bytes, 0, ascii('ID3'))) return FORMATS.MP3;
  const first = bytes[0];
  const second = bytes[1];
  if (first === 0xff && second !== undefined && (second & 0xe0) === 0xe0) return FORMATS.MP3;
  return undefined;
}
