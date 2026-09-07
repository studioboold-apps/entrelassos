/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { ChildFileView } from '../ChildFile/types/child-file.types';

export type ExportUserFilesParams = {
  readonly userId: string;
};

/**
 * O que sai na secao de arquivos da exportacao: a MESMA vista da resposta da
 * lista, mais o endereco dos bytes. E' intersecao, e nao uma copia dos campos,
 * porque a vista e' a fonte unica de "o que o pai pode ler" — coluna nova nela
 * chega aqui sozinha, e coluna escondida nela continua escondida aqui.
 *
 * `contentPath` existe porque JSON nao carrega byte. Uma secao com quarenta
 * fotos e nenhum endereco e' catalogo, nao portabilidade: o titular fica
 * sabendo que os arquivos existem e sem como pega-los. No aplicativo o caminho
 * e' montado pela tela; num arquivo baixado nao ha' tela nenhuma.
 */
export type ChildFileExport = ChildFileView & {
  readonly contentPath: string;
};

/**
 * "Liste, para exportar, tudo o que e' desta conta."
 *
 * Porta SEPARADA da varredura, e nao um metodo a mais nela: `Child` consome a
 * varredura e nao exporta nada — numa porta so', ele teria de fingir um
 * `listForExport` que nunca chama.
 *
 * Nao ha `clientIp` porque nao ha trilha nova a escrever: nenhum byte de exame
 * sai por aqui. A exportacao da conta ja' e' registrada pelo repositorio do
 * `User` (`ACCOUNT_EXPORTED`), e o caminho dos bytes tem trilha propria.
 */
export type ChildFileExportPort = {
  listForExport(params: ExportUserFilesParams): Promise<readonly ChildFileExport[]>;
};
