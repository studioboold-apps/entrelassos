/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { readBackupEnvironment } from '../config/environment';
import { createBackupStorage } from '../modules/Backup/backup-storage.factory';
import { createPostgresRestorer } from '../modules/Backup/postgres.adapter';
import { readBackupKey } from '../modules/Backup/backup-cipher.util';
import { restoreBackup } from '../modules/Backup/restore-backup.use-case';
import { createLogger } from '../modules/shared/logger/logger';

const RESTORE_SOURCE = 'restore';

const environment = readBackupEnvironment();
const logger = createLogger({ traceId: RESTORE_SOURCE, source: RESTORE_SOURCE });

const storage = createBackupStorage({
  destination: environment.BACKUP_DESTINATION,
  directory: environment.BACKUP_DIRECTORY,
  bucket: environment.BACKUP_S3_BUCKET,
  endpoint: environment.BACKUP_S3_ENDPOINT,
});

/**
 * Sem argumento, restaura o MAIS RECENTE. O nome do objeto e' cronologico de
 * proposito: as tres da manha nao e' hora de descobrir qual arquivo do balde e'
 * o de ontem.
 */
async function resolveObjectKey(): Promise<string> {
  const requested = process.argv[2];
  if (requested !== undefined && requested.length > 0) return requested;

  const stored = [...(await storage.list())].sort();
  const latest = stored.at(-1);
  if (latest === undefined) throw new Error('nao ha backup guardado para restaurar');

  return latest;
}

const objectKey = await resolveObjectKey();
const targetUrl =
  environment.RESTORE_DATABASE_URL.length > 0
    ? environment.RESTORE_DATABASE_URL
    : environment.DATABASE_URL;

const result = await restoreBackup({
  objectKey,
  storage,
  key: readBackupKey(environment.BACKUP_ENCRYPTION_KEY),
  restorer: createPostgresRestorer(targetUrl),
});

logger.info('backup restaurado', { objectKey, byteLength: result.byteLength });
