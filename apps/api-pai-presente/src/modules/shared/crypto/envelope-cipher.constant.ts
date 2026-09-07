/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/** AES-256-GCM: cifra e ETIQUETA. Sem a etiqueta, byte trocado volta em silencio. */
export const ENVELOPE_CIPHER_ALGORITHM = 'aes-256-gcm';

export const ENVELOPE_KEY_BYTES = 32;
/** 96 bits e' o IV recomendado para GCM — outro tamanho degrada a garantia. */
export const ENVELOPE_IV_BYTES = 12;
export const ENVELOPE_AUTH_TAG_BYTES = 16;
