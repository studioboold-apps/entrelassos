/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { decryptBackup } from './backup-cipher.util';
import type { BackupStorage, DatabaseRestorer } from './backup-storage.interface';

export type RestoreBackupParams = {
  readonly objectKey: string;
  readonly storage: BackupStorage;
  readonly key: Uint8Array;
  readonly restorer: DatabaseRestorer;
};

export type RestoreBackupResult = {
  readonly byteLength: number;
};

/**
 * Decifra ANTES de tocar no banco. A etiqueta do GCM e' o unico ponto em que um
 * envelope truncado ou adulterado pode ser recusado — depois dela, o `psql` ja
 * teria comecado a escrever, e um dump pela metade e' pior que dump nenhum.
 */
export async function restoreBackup(params: RestoreBackupParams): Promise<RestoreBackupResult> {
  const { objectKey, storage, key, restorer } = params;

  const dump = decryptBackup({ envelope: await storage.get(objectKey), key });
  await restorer.restore(dump);

  return { byteLength: dump.byteLength };
}
