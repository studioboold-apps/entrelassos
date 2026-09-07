/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { createFilesystemMediaStorage } from './filesystem-media-storage';
import { createS3MediaStorage } from './s3-media-storage';
import type { MediaStorage } from './media-storage.interface';
import {
  MEDIA_BUCKET_VARIABLE,
  MEDIA_DESTINATIONS,
  MEDIA_DIRECTORY_VARIABLE,
  type MediaDestination,
} from './media.constant';

export type CreateMediaStorageParams = {
  readonly destination: MediaDestination;
  readonly directory: string;
  readonly bucket: string;
  readonly endpoint: string;
};

/**
 * Falha em voz alta quando o destino escolhido nao tem para onde escrever, e o
 * motivo aqui e' pior do que no backup: um balde nao configurado faria a foto
 * cair em disco de conteiner do Railway, que o proximo deploy joga fora. O pai
 * subiria o album da infancia e ele desapareceria num dia qualquer, sem erro
 * nenhum na tela.
 */
export function createMediaStorage(params: CreateMediaStorageParams): MediaStorage {
  const { destination, directory, bucket, endpoint } = params;

  if (destination === MEDIA_DESTINATIONS.S3) {
    if (bucket.length === 0) {
      throw new Error(`${MEDIA_BUCKET_VARIABLE} vazio com MEDIA_DESTINATION=s3`);
    }

    return createS3MediaStorage(endpoint.length === 0 ? { bucket } : { bucket, endpoint });
  }

  if (directory.length === 0) {
    throw new Error(`${MEDIA_DIRECTORY_VARIABLE} vazio com MEDIA_DESTINATION=filesystem`);
  }

  return createFilesystemMediaStorage(directory);
}
