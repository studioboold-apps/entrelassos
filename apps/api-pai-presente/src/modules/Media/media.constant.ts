/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

export const MEDIA_DESTINATIONS = {
  FILESYSTEM: 'filesystem',
  S3: 's3',
} as const;
export type MediaDestination = (typeof MEDIA_DESTINATIONS)[keyof typeof MEDIA_DESTINATIONS];

/** Raiz da chave. Abaixo dela so entra uuid — nome de arquivo e' PII. */
export const MEDIA_OBJECT_ROOT = 'children';

/**
 * Cinco minutos. O link assinado vive o bastante para o navegador buscar a foto
 * e nao o bastante para ser colado num grupo de mensagens e continuar abrindo.
 */
export const DEFAULT_PRESIGN_TTL_SECONDS = 300;

export const MEDIA_DIRECTORY_VARIABLE = 'MEDIA_DIRECTORY';
export const MEDIA_BUCKET_VARIABLE = 'MEDIA_S3_BUCKET';
