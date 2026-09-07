/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import {
  CONTENT_LENGTH_HEADER,
  HTTP_METHODS,
  HTTP_STATUS,
} from '../shared/http/http.constant';
import { parsePagination, parseWithSchema, readClientIp } from '../shared/http/request.util';
import { respondWithData, respondWithList } from '../shared/http/response.util';
import type { RouteDefinition } from '../shared/http/route.types';
import { ValidationError } from '../shared/errors/shared.error';
import {
  CHILD_FILE_ENVELOPE_ALLOWANCE_BYTES,
  CHILD_FILE_MAX_BYTES,
} from '../shared/shared.constant';
import { uuidSchema } from '../shared/shared.schema';
import { CHILD_FILES_PATH, CHILD_FILE_FORM_FIELDS } from './child-file.constant';
import { ChildFileMissingError, ChildFileTooLargeError } from './child-file.error';
import { uploadChildFileFieldsSchema } from './child-file.schema';
import type { ChildFileUseCases } from './child-file.use-case';

/**
 * Checagem BARATA, e nao a decisao. O cabecalho e' escrito pelo cliente, entao
 * ele nunca autoriza nada — ele apenas evita guardar dois gigabytes na memoria
 * para recusa-los depois. A folga existe porque a moldura do multipart soma
 * bytes ao corpo: sem ela, esta checagem seria mais severa que a regra.
 */
function assertDeclaredSizeFits(request: Request): void {
  const declared = Number(request.headers.get(CONTENT_LENGTH_HEADER));
  if (!Number.isFinite(declared)) return;
  if (declared > CHILD_FILE_MAX_BYTES + CHILD_FILE_ENVELOPE_ALLOWANCE_BYTES) {
    throw new ChildFileTooLargeError(declared);
  }
}

/**
 * O `FormData` do `Request` vem da implementacao do runtime, que nao e' o mesmo
 * tipo do `FormData` global sob os tipos do Node. Tomar o tipo do proprio metodo
 * evita escolher um dos dois e errar.
 */
type RequestFormData = Awaited<ReturnType<Request['formData']>>;

/** Corpo que nao e' multipart nao e' erro de servidor: e' pedido malformado. */
async function readFormData(request: Request): Promise<RequestFormData> {
  try {
    return await request.formData();
  } catch {
    throw new ValidationError([
      { field: 'body', message: 'Envie o arquivo como multipart/form-data.' },
    ]);
  }
}

/**
 * Campo de formulario vazio e' campo AUSENTE. O navegador manda `caption=`
 * mesmo quando o pai nao escreveu nada, e deixar a string vazia chegar ao Zod
 * transformaria "nao quis legenda" em erro de validacao.
 */
function readTextFields(form: RequestFormData): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const name of [
    CHILD_FILE_FORM_FIELDS.KIND,
    CHILD_FILE_FORM_FIELDS.CAPTION,
    CHILD_FILE_FORM_FIELDS.TAKEN_ON,
  ]) {
    const value = form.get(name);
    if (typeof value === 'string' && value.trim().length > 0) fields[name] = value;
  }
  return fields;
}

export function buildChildFileRoutes(useCases: ChildFileUseCases): readonly RouteDefinition[] {
  return [
    {
      method: HTTP_METHODS.POST,
      path: CHILD_FILES_PATH,
      summary: 'Guarda uma foto ou um exame do filho.',
      handle: async ({ request, pathParams, authenticatedUser }) => {
        const childId = parseWithSchema(uuidSchema, pathParams.childId);
        assertDeclaredSizeFits(request);

        const form = await readFormData(request);
        const file = form.get(CHILD_FILE_FORM_FIELDS.FILE);
        if (!(file instanceof Blob) || file.size === 0) throw new ChildFileMissingError();

        const { kind, caption, takenOn } = parseWithSchema(
          uploadChildFileFieldsSchema,
          readTextFields(form),
        );

        const view = await useCases.upload({
          childId,
          userId: authenticatedUser.userId,
          kind,
          bytes: new Uint8Array(await file.arrayBuffer()),
          clientIp: readClientIp(request),
          ...(caption !== undefined ? { caption } : {}),
          ...(takenOn !== undefined ? { takenOn } : {}),
        });

        return respondWithData(view, HTTP_STATUS.CREATED);
      },
    },
    {
      method: HTTP_METHODS.GET,
      path: CHILD_FILES_PATH,
      summary: 'Lista as fotos e os exames do filho, sem os bytes.',
      handle: async ({ url, pathParams, authenticatedUser }) => {
        const childId = parseWithSchema(uuidSchema, pathParams.childId);
        const { page, perPage, offset } = parsePagination(url);

        const { items, total } = await useCases.list({
          childId,
          userId: authenticatedUser.userId,
          limit: perPage,
          offset,
        });

        return respondWithList(items, { total, page, perPage });
      },
    },
  ];
}
