/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { ActivityRow } from '../../Activity/activity.table';
import type { AuthIdentityRow } from '../../Auth/auth.table';
import type { ChatMessageRow } from '../../ChatMessage/chat-message.table';
import type { ChildRow } from '../../Child/child.table';
import type { CommunityCommentRow } from '../../CommunityComment/community-comment.table';
import type {
  CommunityPostLikeRow,
  CommunityPostRow,
} from '../../CommunityPost/community-post.table';
import type { InsightRatingRow } from '../../InsightRating/insight-rating.table';
import type { ChildFilePurgePort } from '../../shared/child-file-purge.interface';
import type {
  ChildFileExport,
  ChildFileExportPort,
} from '../../shared/child-file-export.interface';
import type { UpdateUserBody } from '../user.schema';
import type { UserRow } from '../user.table';

export type FindUserParams = { readonly userId: string };

export type UpdateUserParams = {
  readonly userId: string;
  readonly values: UpdateUserBody;
};

export type EnsureUserParams = {
  readonly userId: string;
  readonly email: string;
};

/**
 * O IP vem junto porque a exclusao e a linha de auditoria que a registra caem
 * ou passam JUNTAS (`security.md` §10). Se ele parasse na rota, a trilha
 * nasceria com a coluna sempre vazia — foi assim que a auditoria de outros
 * produtos virou enfeite.
 */
export type DeleteUserParams = {
  readonly userId: string;
  readonly clientIp: string;
};

export type ExportUserParams = {
  readonly userId: string;
  readonly clientIp: string;
};

/**
 * Portabilidade (LGPD art. 18 V) so vale se vier tudo: secao ausente e secao
 * vazia sao indistinguiveis para quem recebe o arquivo, e o titular nao tem
 * como saber que faltou. Por isso toda chave existe, mesmo sem linha nenhuma.
 *
 * `sessions` fica DE FORA de proposito — e a unica das dez. Ela guarda o hash
 * do refresh, material de credencial: um arquivo baixado com ele dentro vira
 * chave de sessao onde quer que o arquivo pare.
 */
export type AccountExport = {
  readonly user: UserRow;
  readonly authIdentities: readonly AuthIdentityRow[];
  readonly children: readonly ChildRow[];
  readonly activities: readonly ActivityRow[];
  readonly insightRatings: readonly InsightRatingRow[];
  readonly communityPosts: readonly CommunityPostRow[];
  readonly communityPostLikes: readonly CommunityPostLikeRow[];
  readonly communityComments: readonly CommunityCommentRow[];
  readonly chatMessages: readonly ChatMessageRow[];
  /**
   * Vem por PORTA, do `ChildFile`: a vista que esconde a `objectKey` e o
   * endereco por onde os bytes saem moram la'. Uma consulta propria aqui seria
   * uma segunda copia dessa vista, e a edicao que faltasse nela mandaria a
   * chave do balde dentro de um arquivo que o pai baixa.
   */
  readonly childFiles: readonly ChildFileExport[];
};

/**
 * O que o repositorio sabe montar: tudo menos os arquivos. A secao dos
 * arquivos e' de outro modulo, e o tipo diz isso em vez de deixar o
 * repositorio devolver um `AccountExport` pela metade.
 */
export type AccountExportWithoutFiles = Omit<AccountExport, 'childFiles'>;

export type CreateUserUseCasesParams = {
  readonly repository: UserRepository;
  /**
   * A cascata do banco leva as LINHAS dos arquivos e nenhum byte. Porta, e nao
   * consulta propria: quem conhece o balde e' `ChildFile`.
   */
  readonly childFiles: ChildFilePurgePort;
  /**
   * Porta separada da varredura porque `Child` consome so' a varredura: numa
   * porta so', ele teria de fingir um `listForExport` que nunca chama.
   */
  readonly childFileExport: ChildFileExportPort;
};

export type UserRepository = {
  findById(params: FindUserParams): Promise<UserRow | undefined>;
  update(params: UpdateUserParams): Promise<UserRow | undefined>;
  deleteById(params: DeleteUserParams): Promise<boolean>;
  exportAll(params: ExportUserParams): Promise<AccountExportWithoutFiles | undefined>;
};
