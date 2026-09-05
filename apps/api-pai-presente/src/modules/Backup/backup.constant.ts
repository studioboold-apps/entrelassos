/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/** AES-256-GCM: cifra e ETIQUETA. Sem a etiqueta, byte trocado volta em silencio. */
export const BACKUP_CIPHER_ALGORITHM = 'aes-256-gcm';

export const BACKUP_KEY_BYTES = 32;
/** 96 bits e' o IV recomendado para GCM — outro tamanho degrada a garantia. */
export const BACKUP_IV_BYTES = 12;
export const BACKUP_AUTH_TAG_BYTES = 16;

/** Quem acha o arquivo daqui a um ano precisa saber o que ele e' antes de tentar. */
export const BACKUP_ENVELOPE_MAGIC = 'PPBK1';

export const BACKUP_KEY_VARIABLE = 'BACKUP_ENCRYPTION_KEY';
export const BACKUP_OBJECT_ROOT = 'pai-presente';
export const BACKUP_OBJECT_EXTENSION = '.sql.enc';
export const DEFAULT_BACKUP_ENVIRONMENT = 'dev';

export const BACKUP_DESTINATIONS = {
  FILESYSTEM: 'filesystem',
  S3: 's3',
} as const;
export type BackupDestination = (typeof BACKUP_DESTINATIONS)[keyof typeof BACKUP_DESTINATIONS];
