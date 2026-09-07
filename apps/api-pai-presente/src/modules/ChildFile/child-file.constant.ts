/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { MEDIA_CONTENT_TYPES } from '../Media/media.constant';
import { CHILD_FILE_KINDS, type ChildFileKind } from '../shared/shared.constant';

export const CHILD_FILES_PATH = '/v1/children/:childId/files';

/**
 * O conteudo tem caminho PROPRIO, e nao um `?content=1` na lista: e' o endereco
 * que vai dentro de um `<img src>` e de um visualizador de PDF, e e' o unico
 * lugar por onde byte de arquivo de filho sai.
 */
export const CHILD_FILE_PATH = '/v1/children/:childId/files/:fileId';

export const CHILD_FILE_CONTENT_PATH = '/v1/children/:childId/files/:fileId/content';

/**
 * Como o arquivo chega ao pai. Sao os DOIS caminhos possiveis, e a escolha nunca
 * e' do cliente:
 *
 * - `LINK`: o balde entrega, com a API fora do caminho. O celular baixa a foto
 *   direto, e o servidor da API nao gasta banda repassando megabyte de album.
 * - `BYTES`: a API entrega, decifrando. E' o unico caminho auditavel, porque
 *   link assinado deixa de ser observavel no instante em que e' emitido — e
 *   por isso e' o caminho OBRIGATORIO do exame (`security.md` §10).
 */
export const CHILD_FILE_DELIVERIES = {
  LINK: 'link',
  BYTES: 'bytes',
} as const;
export type ChildFileDelivery = (typeof CHILD_FILE_DELIVERIES)[keyof typeof CHILD_FILE_DELIVERIES];

/**
 * 302, e nao 307: o pedido e' `GET`, nao ha corpo para preservar, e 302 e' o que
 * todo navegador e todo `<img>` seguem sem perguntar.
 */
export const CHILD_FILE_REDIRECT_STATUS = 302;

/**
 * `no-store`, nao `max-age`. Nem o link assinado nem o exame decifrado podem
 * ficar em cache de proxy: o link sobreviveria ao proprio prazo guardado por um
 * intermediario, e o exame e' dado de saude de crianca em disco de terceiro.
 */
export const CHILD_FILE_CACHE_CONTROL = 'private, no-store';

/**
 * `inline` e SEM `filename`. Sem `filename` porque nome de arquivo e' PII e
 * este produto nao guarda nenhum (ver `child-file.table.ts`); `inline` porque o
 * pai abre a foto e o laudo na tela — `attachment` forcaria download de um
 * arquivo que ele nao pediu para baixar.
 */
export const CHILD_FILE_CONTENT_DISPOSITION = 'inline';

/**
 * Os nomes das partes do formulario. Ficam aqui porque o teste do controlador
 * monta o `FormData` com eles: uma string solta nos dois lugares concorda so'
 * ate a primeira edicao (`code-standart.md` §16).
 */
export const CHILD_FILE_FORM_FIELDS = {
  FILE: 'file',
  KIND: 'kind',
  CAPTION: 'caption',
  TAKEN_ON: 'takenOn',
} as const;

const IMAGE_CONTENT_TYPES = [
  MEDIA_CONTENT_TYPES.JPEG,
  MEDIA_CONTENT_TYPES.PNG,
  MEDIA_CONTENT_TYPES.WEBP,
  MEDIA_CONTENT_TYPES.HEIC,
] as const;

/**
 * O que cada tipo de registro aceita — e a razao de a checagem existir depois
 * de o tipo ja ter sido lido dos BYTES.
 *
 * Foto so' aceita imagem porque a linha do tempo desenha foto como imagem: um
 * PDF entrando como `foto` viraria um quadrado quebrado no album.
 *
 * Exame aceita PDF **e imagem**: o caso real mais comum nao e' o laboratorio
 * mandando PDF, e' o pai fotografando o papel com o celular.
 */
export const CHILD_FILE_ALLOWED_CONTENT_TYPES: Readonly<Record<ChildFileKind, readonly string[]>> =
  {
    foto: IMAGE_CONTENT_TYPES,
    exame: [...IMAGE_CONTENT_TYPES, MEDIA_CONTENT_TYPES.PDF],
  };

/**
 * Qual dos dois tipos guarda dado de saude. A cifra, a trilha e o consentimento
 * do art. 14 §1 pendem TODOS desta resposta, e ela mora num lugar so' — derivar
 * "e' exame?" com `kind === 'exame'` espalhado por quatro arquivos e' como se
 * perde uma das quatro no dia em que aparecer um terceiro tipo.
 *
 * Aceita `string` porque a coluna e' VARCHAR (`code-standart.md` §8 proibe ENUM
 * nativo): a linha que volta do banco nao tem como provar o tipo estreito, e
 * exigi-lo aqui empurraria um `as` para todo chamador que le' do banco.
 */
export function isHealthData(kind: ChildFileKind | string): boolean {
  return kind === CHILD_FILE_KINDS[1];
}
