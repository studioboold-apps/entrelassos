/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';

import type { MediaStorage } from './media-storage.interface';

/**
 * A chave e' gerada por nos (`children/{childId}/{fileId}`), mas quem confia na
 * origem da chave escreve o adaptador que aceita `../../etc/passwd` no dia em
 * que alguem passar a aceitar chave de fora. A guarda custa uma linha e mora no
 * lugar onde o dano aconteceria.
 */
function resolveWithin(directory: string, objectKey: string): string {
  const root = resolve(directory);
  const target = resolve(root, objectKey);

  if (target !== root && !target.startsWith(root + sep)) {
    throw new Error(`chave de objeto sai da pasta da midia: ${objectKey}`);
  }

  return target;
}

/**
 * O destino que prova o ciclo sem credencial de nuvem. Ele guarda os MESMOS
 * bytes que o balde guardaria — o exame chega aqui ja cifrado pelo use case.
 *
 * Nao declara `presignRead`: disco nao assina link, e mentir que assina faria a
 * foto sair como caminho de arquivo local dentro de um `src` de imagem.
 */
export function createFilesystemMediaStorage(directory: string): MediaStorage {
  return {
    async put({ objectKey, bytes }) {
      const target = resolveWithin(directory, objectKey);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, bytes, { mode: 0o600 });
    },
    async get(objectKey) {
      return new Uint8Array(await readFile(resolveWithin(directory, objectKey)));
    },
    async delete(objectKey) {
      await rm(resolveWithin(directory, objectKey), { force: true });
    },
  };
}
