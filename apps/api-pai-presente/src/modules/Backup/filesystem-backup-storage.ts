/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';

import type { BackupStorage } from './backup-storage.interface';

/**
 * O destino que prova o ciclo sem credencial de nuvem. Ele guarda o MESMO
 * envelope que o S3 guardaria — a cifragem acontece antes, no use case, e nao
 * dentro do adaptador; se estivesse aqui, trocar de destino perderia a cifra.
 */
export function createFilesystemBackupStorage(directory: string): BackupStorage {
  const pathOf = (objectKey: string): string => join(directory, objectKey);

  return {
    async put({ objectKey, bytes }) {
      const target = pathOf(objectKey);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, bytes, { mode: 0o600 });
    },
    async get(objectKey) {
      return new Uint8Array(await readFile(pathOf(objectKey)));
    },
    async list() {
      const entries = await readdir(directory, { recursive: true, withFileTypes: true });

      return entries
        .filter((entry) => entry.isFile())
        .map((entry) => relative(directory, join(entry.parentPath, entry.name)).split(sep).join('/'))
        .sort();
    },
  };
}
