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

/**
 * Os tipos que este produto sabe guardar E servir depois. A lista e' curta de
 * proposito: `image/svg+xml` esta fora porque SVG carrega `<script>`.
 */
export const MEDIA_CONTENT_TYPES = {
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  WEBP: 'image/webp',
  HEIC: 'image/heic',
  PDF: 'application/pdf',
} as const;

export type MediaContentType = (typeof MEDIA_CONTENT_TYPES)[keyof typeof MEDIA_CONTENT_TYPES];

/**
 * Magica propria, diferente da do backup: envelope de proposito diferente nunca
 * deve abrir como se fosse o outro, mesmo que a cifra seja a mesma.
 */
export const MEDIA_ENVELOPE_MAGIC = 'PPMD1';

export const MEDIA_KEY_VARIABLE = 'MEDIA_ENCRYPTION_KEY';

export const MEDIA_DIRECTORY_VARIABLE = 'MEDIA_DIRECTORY';
export const MEDIA_BUCKET_VARIABLE = 'MEDIA_S3_BUCKET';
