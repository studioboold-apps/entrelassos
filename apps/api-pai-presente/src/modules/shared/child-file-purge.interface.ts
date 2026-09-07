/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

export type PurgeChildFilesParams = {
  readonly childId: string;
  readonly userId: string;
  /** Vai para a trilha do exame apagado, nao para o log (`security.md` §1). */
  readonly clientIp: string;
};

/**
 * "Tire do balde tudo o que e' deste filho."
 *
 * Existe porque `ON DELETE CASCADE` apaga LINHA e nao apaga byte: o Postgres
 * nao sabe que o balde existe. E como `MediaStorage` nao tem `list()` de
 * proposito — quem sabe quais arquivos um filho tem e' o Postgres —, byte cuja
 * linha a cascata levou e' byte que ninguem consegue mais nomear para apagar.
 * Por isso a varredura acontece ANTES do `DELETE`, sempre.
 *
 * Mora em `shared/` porque tem dois donos: quem apaga um filho (`Child`) e
 * quem apaga a conta inteira (`User`). O implementador e' `ChildFile`, o unico
 * modulo que ja' tem repositorio, balde e trilha na mesma mao.
 */
export type PurgeUserFilesParams = {
  readonly userId: string;
  /** Vai para a trilha do exame apagado, nao para o log (`security.md` §1). */
  readonly clientIp: string;
};

export type ChildFilePurgePort = {
  purgeByChild(params: PurgeChildFilesParams): Promise<void>;
  /**
   * "Tire do balde tudo o que e' desta conta."
   *
   * Nao e' `purgeByChild` num laco: quem apaga a conta nao tem a lista de
   * filhos na mao, e busca-la para depois varrer um por um faria N+1 consultas
   * pelo mesmo resultado de uma consulta escopada por dono. E se um filho fosse
   * criado entre a listagem e a varredura, o album dele ficaria no balde sem a
   * linha que o nomeia.
   */
  purgeByUser(params: PurgeUserFilesParams): Promise<void>;
};
