/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { MediaStorage, PresignReadParams } from './media-storage.interface';

export type CreateS3MediaStorageParams = {
  readonly bucket: string;
  /** Vazio usa o endpoint padrao da AWS; qualquer S3-compativel entra por aqui. */
  readonly endpoint?: string;
};

/**
 * `Bun.S3Client` e' do runtime: nenhuma dependencia nova para guardar uma foto
 * (`code-standart.md` §13). Credencial por ambiente (`security.md` §7) —
 * staging e producao nunca compartilham chave.
 *
 * O balde e' PRIVADO. A foto sai por link assinado de vida curta, e nao por
 * objeto publico: objeto publico e' um endereco que continua abrindo depois de o
 * pai apagar a conta, e nao existe como retirar um endereco que ja circulou.
 */
export function createS3MediaStorage(params: CreateS3MediaStorageParams): MediaStorage {
  const { bucket, endpoint } = params;
  const client = new Bun.S3Client(endpoint === undefined ? { bucket } : { bucket, endpoint });

  return {
    async put({ objectKey, bytes, contentType }) {
      await client.write(objectKey, bytes, { type: contentType });
    },
    async get(objectKey) {
      return new Uint8Array(await client.file(objectKey).arrayBuffer());
    },
    async delete(objectKey) {
      await client.delete(objectKey);
    },
    async presignRead({ objectKey, ttlSeconds }: PresignReadParams) {
      return client.presign(objectKey, { expiresIn: ttlSeconds, method: 'GET' });
    },
  };
}
