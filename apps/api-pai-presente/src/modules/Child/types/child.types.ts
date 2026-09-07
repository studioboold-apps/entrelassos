/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { ChildFilePurgePort } from '../../shared/child-file-purge.interface';
import type { ChildRow, NewChildRow } from '../child.table';
import type { CreateChildBody, UpdateChildBody } from '../child.schema';

export type ListChildrenParams = {
  readonly userId: string;
  readonly limit: number;
  readonly offset: number;
};

export type ListChildrenResult = {
  readonly items: readonly ChildRow[];
  readonly total: number;
};

export type FindChildParams = {
  readonly childId: string;
  readonly userId: string;
};

export type UpdateChildParams = {
  readonly childId: string;
  readonly userId: string;
  readonly values: UpdateChildBody;
};

/**
 * Apagar carrega o IP, o que ler e atualizar nao carregam: e' o unico dos
 * quatro que produz trilha, porque e' o unico que tira exame do balde.
 */
export type RemoveChildParams = FindChildParams & {
  /** Vai para a trilha do exame apagado, nao para o log (`security.md` §1). */
  readonly clientIp: string;
};

export type CreateChildParams = {
  readonly userId: string;
  readonly values: CreateChildBody;
};

/** O que o prompt precisa saber de um filho — nem hobby, nem cor, nem data. */
export type ChildContextRow = {
  readonly name: string;
  readonly age: number;
  readonly gender: string;
};

export type ChildRepository = {
  list(params: ListChildrenParams): Promise<ListChildrenResult>;
  findById(params: FindChildParams): Promise<ChildRow | undefined>;
  insert(row: NewChildRow): Promise<ChildRow>;
  update(params: UpdateChildParams): Promise<ChildRow | undefined>;
  remove(params: FindChildParams): Promise<boolean>;
  listContext(userId: string): Promise<readonly ChildContextRow[]>;
};

/**
 * Objeto, e nao dois parametros posicionais (`code-standart.md` §10): o filho
 * passou a ter um segundo dono no apagamento, e uma lista posicional cresceria
 * sem nome a cada dono novo.
 */
export type CreateChildUseCasesParams = {
  readonly repository: ChildRepository;
  /**
   * A cascata do banco leva as LINHAS dos arquivos e nenhum byte. Porta, e nao
   * consulta propria: quem conhece o balde e' `ChildFile`.
   */
  readonly childFiles: ChildFilePurgePort;
};
