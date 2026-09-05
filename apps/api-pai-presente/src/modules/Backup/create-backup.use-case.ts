/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { DEFAULT_BACKUP_ENVIRONMENT } from './backup.constant';
import { buildBackupObjectKey } from './backup-object-key.util';
import { encryptBackup } from './backup-cipher.util';
import type { BackupStorage, DatabaseDumper } from './backup-storage.interface';

export type CreateBackupParams = {
  readonly dumper: DatabaseDumper;
  readonly storage: BackupStorage;
  readonly key: Uint8Array;
  readonly now: Date;
  readonly environmentName?: string;
};

export type CreateBackupResult = {
  readonly objectKey: string;
  readonly byteLength: number;
};

/**
 * A ORDEM e' a regra (`security.md` §5): cifra, e so depois entrega ao destino.
 * O texto claro nunca existe como objeto — nem como arquivo temporario no disco,
 * que e' onde a versao "cifra depois" costuma deixar o dump esquecido.
 */
export async function createBackup(params: CreateBackupParams): Promise<CreateBackupResult> {
  const { dumper, storage, key, now, environmentName = DEFAULT_BACKUP_ENVIRONMENT } = params;

  const envelope = encryptBackup({ plaintext: await dumper.dump(), key });
  const objectKey = buildBackupObjectKey({ environmentName, now });

  await storage.put({ objectKey, bytes: envelope });

  return { objectKey, byteLength: envelope.byteLength };
}
