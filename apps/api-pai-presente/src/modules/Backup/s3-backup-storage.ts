/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { BackupStorage } from './backup-storage.interface';

export type CreateS3BackupStorageParams = {
  readonly bucket: string;
  /** Vazio usa o endpoint padrao da AWS; qualquer S3-compativel entra por aqui. */
  readonly endpoint?: string;
};

/**
 * `Bun.S3Client` e' do runtime: nenhuma dependencia nova para subir um objeto
 * (code-standart.md §13). Credencial vem do ambiente, por ambiente
 * (`security.md` §7) — staging e producao nunca compartilham chave.
 *
 * O balde e' PRIVADO. Nao existe `presign` aqui de proposito: backup nao se
 * entrega por link, se busca com credencial.
 */
export function createS3BackupStorage(params: CreateS3BackupStorageParams): BackupStorage {
  const { bucket, endpoint } = params;
  const client = new Bun.S3Client(endpoint === undefined ? { bucket } : { bucket, endpoint });

  return {
    async put({ objectKey, bytes }) {
      await client.write(objectKey, bytes);
    },
    async get(objectKey) {
      return new Uint8Array(await client.file(objectKey).arrayBuffer());
    },
    async list() {
      const listing = await client.list();

      return (listing.contents ?? []).map((object) => object.key);
    },
  };
}
