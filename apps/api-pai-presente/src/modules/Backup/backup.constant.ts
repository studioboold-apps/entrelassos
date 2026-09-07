/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

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
