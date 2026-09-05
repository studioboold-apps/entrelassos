/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

export type BackupObject = {
  readonly objectKey: string;
  readonly bytes: Uint8Array;
};

/**
 * O destino do backup e' INTERFACE (code-standart.md §6) por um motivo pratico:
 * a prova de restauracao roda em disco, e producao roda em balde S3. Sem isto,
 * provar o ciclo exigiria credencial de nuvem em maquina de desenvolvimento.
 */
export type BackupStorage = {
  put(object: BackupObject): Promise<void>;
  get(objectKey: string): Promise<Uint8Array>;
  list(): Promise<readonly string[]>;
};

/** O banco de onde os bytes saem. Trocavel para provar o ciclo sem Postgres. */
export type DatabaseDumper = {
  dump(): Promise<Uint8Array>;
};

/** E o banco para onde eles voltam. */
export type DatabaseRestorer = {
  restore(dump: Uint8Array): Promise<void>;
};
