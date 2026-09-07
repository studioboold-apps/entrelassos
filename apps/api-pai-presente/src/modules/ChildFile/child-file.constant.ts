/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { MEDIA_CONTENT_TYPES } from '../Media/media.constant';
import { CHILD_FILE_KINDS, type ChildFileKind } from '../shared/shared.constant';

export const CHILD_FILES_PATH = '/v1/children/:childId/files';

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
 */
export function isHealthData(kind: ChildFileKind): boolean {
  return kind === CHILD_FILE_KINDS[1];
}
