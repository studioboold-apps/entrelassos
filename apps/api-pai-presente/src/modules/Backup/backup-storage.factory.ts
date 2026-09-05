/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { BACKUP_DESTINATIONS, type BackupDestination } from './backup.constant';
import { createFilesystemBackupStorage } from './filesystem-backup-storage';
import { createS3BackupStorage } from './s3-backup-storage';
import type { BackupStorage } from './backup-storage.interface';

export type CreateBackupStorageParams = {
  readonly destination: BackupDestination;
  readonly directory: string;
  readonly bucket: string;
  readonly endpoint: string;
};

/**
 * Falha em voz alta quando o destino escolhido nao tem para onde escrever. O
 * silencio aqui seria o pior modo: o job rodaria todo dia, gravaria em disco de
 * contêiner efemero, e o backup so faltaria no dia em que precisasse existir.
 */
export function createBackupStorage(params: CreateBackupStorageParams): BackupStorage {
  const { destination, directory, bucket, endpoint } = params;

  if (destination === BACKUP_DESTINATIONS.S3) {
    if (bucket.length === 0) throw new Error('BACKUP_S3_BUCKET vazio com BACKUP_DESTINATION=s3');

    return createS3BackupStorage(endpoint.length === 0 ? { bucket } : { bucket, endpoint });
  }

  if (directory.length === 0) {
    throw new Error('BACKUP_DIRECTORY vazio com BACKUP_DESTINATION=filesystem');
  }

  return createFilesystemBackupStorage(directory);
}
