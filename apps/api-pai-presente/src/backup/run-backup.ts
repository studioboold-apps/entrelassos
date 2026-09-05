/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { readBackupEnvironment } from '../config/environment';
import { createBackup } from '../modules/Backup/create-backup.use-case';
import { createBackupStorage } from '../modules/Backup/backup-storage.factory';
import { createPostgresDumper } from '../modules/Backup/postgres.adapter';
import { readBackupKey } from '../modules/Backup/backup-cipher.util';
import { createLogger } from '../modules/shared/logger/logger';

const BACKUP_SOURCE = 'backup';

const environment = readBackupEnvironment();
const logger = createLogger({ traceId: BACKUP_SOURCE, source: BACKUP_SOURCE });

const result = await createBackup({
  dumper: createPostgresDumper(environment.DATABASE_URL),
  storage: createBackupStorage({
    destination: environment.BACKUP_DESTINATION,
    directory: environment.BACKUP_DIRECTORY,
    bucket: environment.BACKUP_S3_BUCKET,
    endpoint: environment.BACKUP_S3_ENDPOINT,
  }),
  key: readBackupKey(environment.BACKUP_ENCRYPTION_KEY),
  now: new Date(),
  environmentName: environment.BACKUP_ENVIRONMENT,
});

logger.info('backup cifrado e guardado', {
  objectKey: result.objectKey,
  byteLength: result.byteLength,
  destination: environment.BACKUP_DESTINATION,
});
