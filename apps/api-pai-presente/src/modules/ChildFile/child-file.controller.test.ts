/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';

import type { AuditEntry } from '../Audit/types/audit.types';
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '../Audit/audit.constant';
import { decryptMedia, encryptMedia, readMediaKey } from '../Media/media-cipher';
import { DEFAULT_PRESIGN_TTL_SECONDS, MEDIA_ENVELOPE_MAGIC } from '../Media/media.constant';
import type { MediaObject, MediaStorage, PresignReadParams } from '../Media/media-storage.interface';
import { ENVELOPE_KEY_BYTES } from '../shared/crypto/envelope-cipher.constant';
import { ERROR_CODES } from '../shared/errors/codes';
import type { ChildConsentPort } from '../shared/child-consent.interface';
import type { ChildOwnershipPort } from '../shared/child-ownership.interface';
import { CHILD_FILE_MAX_BYTES } from '../shared/shared.constant';
import {
  CACHE_CONTROL_HEADER,
  CONTENT_DISPOSITION_HEADER,
  CONTENT_TYPE_HEADER,
  HTTP_METHODS,
  LOCATION_HEADER,
} from '../shared/http/http.constant';

import {
  CHILD_FILE_CACHE_CONTROL,
  CHILD_FILE_CONTENT_DISPOSITION,
  CHILD_FILE_FORM_FIELDS,
  CHILD_FILE_REDIRECT_STATUS,
} from './child-file.constant';
import { buildChildFileRoutes } from './child-file.controller';
import type { ChildFileRow, NewChildFileRow } from './child-file.table';
import { createChildFileUseCases, type ChildFileUseCases } from './child-file.use-case';
import type { ChildFileAuditPort, ChildFileRepository } from './types/child-file.types';

import {
  MISSING_ID,
  OTHER_USER_ID,
  TEST_USER_ID,
  createTestClient,
  readDataList,
  readDataRecord,
  readErrorCode,
  readPagination,
  type RawTestClient,
  type TestClient,
} from '../../testing/http-test.util';
import { buildIdentity } from '../../testing/row.factory';

const OWNED_CHILD_ID = '77777777-7777-4777-8777-777777777777';
const FOREIGN_CHILD_ID = '88888888-8888-4888-8888-888888888888';
/** Irmao: mesmo pai, outro filho. Apagar um nao pode levar o album do outro. */
const SIBLING_CHILD_ID = '99999999-9999-4999-8999-999999999999';

const KEY = Buffer.alloc(ENVELOPE_KEY_BYTES, 11).toString('base64');

/** O que um balde que assina devolveria. Basta ser reconhecivel. */
const SIGNED_LINK_PREFIX = 'https://balde.example/';

/** O IP entra na trilha, e vem do cabecalho do proxy (`request.util.ts`). */
const CLIENT_IP = '203.0.113.7';
const PROXY_HEADERS = { 'x-forwarded-for': CLIENT_IP } as const;

/**
 * Bytes de VERDADE, e nao um `Blob` com `type` declarado: o tipo se decide pelos
 * bytes, e um teste que passasse o tipo pela etiqueta do multipart provaria
 * exatamente o caminho que a regra proibe.
 */
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

/** Um laudo tem o nome da crianca no cabecalho — e' isso que nao pode aparecer no balde. */
const LAUDO = 'Paciente: Joaquim Girassol';
const PDF = new Uint8Array(Buffer.from(`%PDF-1.4\n${LAUDO}\nHemoglobina: 11,2 g/dL\n`, 'utf8'));

/** Nem imagem, nem PDF: e' o caso em que `detectContentType` devolve `undefined`. */
const DESCONHECIDO = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

type Fakes = {
  readonly useCases: ChildFileUseCases;
  readonly rows: ChildFileRow[];
  readonly objects: Map<string, MediaObject>;
  readonly trail: AuditEntry[];
  /** O que o balde foi mandado assinar — vazio prova que ninguem assinou. */
  readonly presignCalls: PresignReadParams[];
};

type BuildFakesParams = {
  readonly encodedEncryptionKey?: string;
  readonly failOnPut?: boolean;
  /** Balde fora do ar na HORA de apagar — a metade que decide a ordem de `D5`. */
  readonly failOnDelete?: boolean;
  /**
   * Balde que sabe assinar declara `presignRead`; o que nao sabe simplesmente
   * NAO declara — capacidade opcional por ausencia, como o balde de arquivo
   * local de verdade (`filesystem-media-storage.ts`).
   */
  readonly canPresign?: boolean;
  /**
   * Concedido por PADRAO, e de proposito: os testes de exame que ja existiam
   * afirmam cifra, trilha e checksum, nao o art. 14 §1. Se o padrao fosse
   * "sem consentimento", todos eles passariam a medir a recusa — e a cifra
   * deixaria de ter teste sem ninguem apagar teste nenhum.
   */
  readonly consentGranted?: boolean;
};

/** So o filho `OWNED_CHILD_ID` pertence ao usuario do teste. */
const childOwnership: ChildOwnershipPort = {
  isOwnedByUser: async ({ childId, userId }) => childId === OWNED_CHILD_ID && userId === TEST_USER_ID,
};

function createFakeConsent(consentGranted: boolean): ChildConsentPort {
  return { hasConsent: async () => consentGranted };
}

function createFakeRepository(rows: ChildFileRow[]): ChildFileRepository {
  function indexOf(fileId: string, userId: string): number {
    return rows.findIndex((row) => row.id === fileId && row.userId === userId);
  }

  return {
    insert: async (row: NewChildFileRow) => {
      const created: ChildFileRow = {
        ...buildIdentity(row.id ?? ''),
        userId: row.userId,
        childId: row.childId,
        kind: row.kind,
        objectKey: row.objectKey,
        contentType: row.contentType,
        byteSize: row.byteSize,
        checksum: row.checksum,
        isEncrypted: row.isEncrypted ?? false,
        caption: row.caption ?? null,
        takenOn: row.takenOn ?? null,
      };
      rows.push(created);
      return created;
    },
    findById: async ({ fileId, userId }) => rows[indexOf(fileId, userId)],
    /**
     * A dupla nao ORDENA: a ordem da linha do tempo e' medida no SQL de verdade
     * (`child-file.repository.test.ts`, por `toSQL()`). Uma dupla que ordenasse
     * por conta propria provaria a ordem da dupla, e continuaria verde no dia em
     * que o `ORDER BY` do repositorio sumisse.
     */
    listByChild: async ({ childId, userId, limit, offset }) => {
      const scoped = rows.filter((row) => row.childId === childId && row.userId === userId);
      return { items: scoped.slice(offset, offset + limit), total: scoped.length };
    },
    /** Sem teto de pagina, e de proposito: apagar o filho nao pode parar na primeira. */
    listAllByChild: async ({ childId, userId }) =>
      rows.filter((row) => row.childId === childId && row.userId === userId),
    listByUser: async ({ userId }) => rows.filter((row) => row.userId === userId),
    remove: async ({ fileId, userId }) => {
      const position = indexOf(fileId, userId);
      if (position < 0) return undefined;
      const [removed] = rows.splice(position, 1);
      return removed;
    },
  };
}

type CreateFakeStorageParams = {
  readonly objects: Map<string, MediaObject>;
  readonly failOnPut: boolean;
  readonly failOnDelete: boolean;
  readonly canPresign: boolean;
  readonly presignCalls: PresignReadParams[];
};

function createFakeStorage({
  objects,
  failOnPut,
  failOnDelete,
  canPresign,
  presignCalls,
}: CreateFakeStorageParams): MediaStorage {
  const storage: MediaStorage = {
    put: async (object) => {
      if (failOnPut) throw new Error('balde fora do ar');
      objects.set(object.objectKey, object);
    },
    get: async (objectKey) => {
      const found = objects.get(objectKey);
      if (found === undefined) throw new Error('objeto ausente');
      return found.bytes;
    },
    delete: async (objectKey) => {
      if (failOnDelete) throw new Error('balde fora do ar');
      objects.delete(objectKey);
    },
  };

  if (!canPresign) return storage;

  return {
    ...storage,
    presignRead: async (params) => {
      presignCalls.push(params);
      return `${SIGNED_LINK_PREFIX}${params.objectKey}?exp=${params.ttlSeconds}`;
    },
  };
}

function buildFakes({
  encodedEncryptionKey = KEY,
  failOnPut = false,
  failOnDelete = false,
  canPresign = false,
  consentGranted = true,
}: BuildFakesParams = {}): Fakes {
  const rows: ChildFileRow[] = [];
  const objects = new Map<string, MediaObject>();
  const trail: AuditEntry[] = [];
  const presignCalls: PresignReadParams[] = [];
  const audit: ChildFileAuditPort = {
    record: async (entry) => {
      trail.push(entry);
    },
  };

  const useCases = createChildFileUseCases({
    repository: createFakeRepository(rows),
    storage: createFakeStorage({ objects, failOnPut, failOnDelete, canPresign, presignCalls }),
    childOwnership,
    childConsent: createFakeConsent(consentGranted),
    audit,
    encodedEncryptionKey,
  });

  return { useCases, rows, objects, trail, presignCalls };
}

function createClient(useCases: ChildFileUseCases): RawTestClient {
  return createTestClient({ routes: buildChildFileRoutes(useCases) });
}

type UploadParams = {
  readonly kind?: string;
  readonly bytes?: Uint8Array;
  readonly caption?: string;
  readonly takenOn?: string;
  readonly childId?: string;
  readonly headers?: Readonly<Record<string, string>>;
};

async function upload(client: TestClient, params: UploadParams = {}) {
  const { kind = 'foto', bytes = JPEG, caption, takenOn, childId = OWNED_CHILD_ID, headers } = params;

  const form = new FormData();
  if (bytes.byteLength > 0) {
    form.set(CHILD_FILE_FORM_FIELDS.FILE, new Blob([bytes]), 'qualquer-nome');
  }
  form.set(CHILD_FILE_FORM_FIELDS.KIND, kind);
  if (caption !== undefined) form.set(CHILD_FILE_FORM_FIELDS.CAPTION, caption);
  if (takenOn !== undefined) form.set(CHILD_FILE_FORM_FIELDS.TAKEN_ON, takenOn);

  return client.send({
    method: HTTP_METHODS.POST,
    path: `/v1/children/${childId}/files`,
    body: form,
    headers: { ...PROXY_HEADERS, ...headers },
  });
}

type ListParams = {
  readonly childId?: string;
  readonly query?: string;
};

function list(client: TestClient, { childId = OWNED_CHILD_ID, query = '' }: ListParams = {}) {
  return client.send({ method: HTTP_METHODS.GET, path: `/v1/children/${childId}/files${query}` });
}

function contentPath(fileId: string, childId: string): string {
  return `/v1/children/${childId}/files/${fileId}/content`;
}

type ContentParams = {
  readonly fileId: string;
  readonly childId?: string;
};

/** Envelope JSON: serve para o 302 (corpo vazio) e para a recusa. */
function content(client: TestClient, { fileId, childId = OWNED_CHILD_ID }: ContentParams) {
  return client.send({
    method: HTTP_METHODS.GET,
    path: contentPath(fileId, childId),
    headers: PROXY_HEADERS,
  });
}

/** Bytes crus: `JSON.parse` estoura no primeiro byte de um PDF. */
function contentBytes(client: RawTestClient, { fileId, childId = OWNED_CHILD_ID }: ContentParams) {
  return client.sendRaw({
    method: HTTP_METHODS.GET,
    path: contentPath(fileId, childId),
    headers: PROXY_HEADERS,
  });
}

function remove(client: TestClient, { fileId, childId = OWNED_CHILD_ID }: ContentParams) {
  return client.send({
    method: HTTP_METHODS.DELETE,
    path: `/v1/children/${childId}/files/${fileId}`,
    headers: PROXY_HEADERS,
  });
}

async function uploadAndReadId(client: TestClient, params: UploadParams = {}): Promise<string> {
  const response = await upload(client, params);
  return String(readDataRecord(response).id);
}

/**
 * Linha posta A MAO na tabela da dupla, sem passar pelo `POST`: e' o unico jeito
 * de montar o que a rota nao deixa criar — arquivo de OUTRO pai no mesmo filho.
 */
function seed(rows: ChildFileRow[], row: Partial<ChildFileRow> & { readonly id: string }): void {
  rows.push({
    ...buildIdentity(row.id),
    userId: row.userId ?? TEST_USER_ID,
    childId: row.childId ?? OWNED_CHILD_ID,
    kind: row.kind ?? 'foto',
    objectKey: row.objectKey ?? `children/${row.childId ?? OWNED_CHILD_ID}/${row.id}`,
    contentType: row.contentType ?? 'image/jpeg',
    byteSize: row.byteSize ?? JPEG.byteLength,
    checksum: row.checksum ?? sha256(JPEG),
    isEncrypted: row.isEncrypted ?? false,
    caption: row.caption ?? null,
    takenOn: row.takenOn ?? null,
  });
}

describe('a foto entra na historia do filho', () => {
  test('201 com o que o pai precisa ler de volta', async () => {
    const fakes = buildFakes();
    const response = await upload(createClient(fakes.useCases), {
      caption: 'primeiro dia de escola',
      takenOn: '2026-02-10',
    });

    expect(response.status).toBe(201);
    const view = readDataRecord(response);
    expect(view.kind).toBe('foto');
    expect(view.contentType).toBe('image/jpeg');
    expect(view.byteSize).toBe(JPEG.byteLength);
    expect(view.caption).toBe('primeiro dia de escola');
    expect(view.takenOn).toBe('2026-02-10');
  });

  /**
   * `objectKey` diz o desenho do balde, `userId` e' sempre quem perguntou e
   * `isEncrypted` e' contabilidade de rotacao de chave. Nenhum dos tres e'
   * assunto do pai, e o primeiro ajuda quem quiser adivinhar a chave do vizinho.
   */
  test('a resposta nao carrega o desenho interno', async () => {
    const fakes = buildFakes();
    const view = readDataRecord(await upload(createClient(fakes.useCases)));

    expect(view).not.toHaveProperty('objectKey');
    expect(view).not.toHaveProperty('userId');
    expect(view).not.toHaveProperty('isEncrypted');
  });

  /** A chave nasce do id do arquivo, e nunca do nome que o celular mandou (PII). */
  test('a chave do objeto e o filho e o id, sem nome de arquivo', async () => {
    const fakes = buildFakes();
    const view = readDataRecord(await upload(createClient(fakes.useCases)));

    expect([...fakes.objects.keys()]).toEqual([`children/${OWNED_CHILD_ID}/${String(view.id)}`]);
  });

  test('a foto vai para o balde em claro, para o link assinado abrir no navegador', async () => {
    const fakes = buildFakes();
    await upload(createClient(fakes.useCases));

    const [stored] = [...fakes.objects.values()];
    expect(Buffer.from(stored?.bytes ?? new Uint8Array()).equals(Buffer.from(JPEG))).toBe(true);
    expect(stored?.contentType).toBe('image/jpeg');
    expect(fakes.rows[0]?.isEncrypted).toBe(false);
  });

  /** Campo vazio e' campo AUSENTE: o navegador manda `caption=` mesmo sem legenda. */
  test('legenda vazia nao vira legenda em branco', async () => {
    const fakes = buildFakes();
    const view = readDataRecord(await upload(createClient(fakes.useCases), { caption: '', takenOn: '' }));

    expect(view.caption).toBeUndefined();
    expect(view.takenOn).toBeUndefined();
  });
});

describe('o exame e cifrado antes de tocar o balde', () => {
  test('o que fica guardado e envelope, e o nome do paciente nao aparece nele', async () => {
    const fakes = buildFakes();
    const response = await upload(createClient(fakes.useCases), { kind: 'exame', bytes: PDF });

    expect(response.status).toBe(201);
    const [stored] = [...fakes.objects.values()];
    const guardado = Buffer.from(stored?.bytes ?? new Uint8Array());
    expect(guardado.subarray(0, MEDIA_ENVELOPE_MAGIC.length).toString('utf8')).toBe(MEDIA_ENVELOPE_MAGIC);
    expect(guardado.toString('utf8')).not.toContain(LAUDO);
    expect(fakes.rows[0]?.isEncrypted).toBe(true);
  });

  test('o envelope abre de volta no exame que subiu', async () => {
    const fakes = buildFakes();
    await upload(createClient(fakes.useCases), { kind: 'exame', bytes: PDF });

    const [stored] = [...fakes.objects.values()];
    const aberto = decryptMedia({
      envelope: stored?.bytes ?? new Uint8Array(),
      key: Buffer.from(KEY, 'base64'),
    });
    expect(Buffer.from(aberto).equals(Buffer.from(PDF))).toBe(true);
  });

  /** O checksum e' do texto CLARO: e' o que permite dizer que o que voltou e' o que subiu. */
  test('o checksum e do claro, nao do cifrado', async () => {
    const fakes = buildFakes();
    const view = readDataRecord(await upload(createClient(fakes.useCases), { kind: 'exame', bytes: PDF }));

    expect(view.checksum).toBe(sha256(PDF));
    expect(view.byteSize).toBe(PDF.byteLength);
  });

  /**
   * O caso real mais comum nao e' o laboratorio mandando PDF, e' o pai
   * fotografando o papel com o celular.
   */
  test('exame aceita a foto do papel', async () => {
    const fakes = buildFakes();
    const response = await upload(createClient(fakes.useCases), { kind: 'exame', bytes: JPEG });

    expect(response.status).toBe(201);
    expect(fakes.rows[0]?.isEncrypted).toBe(true);
  });
});

describe('sem chave, o exame recusa em voz alta e a foto segue subindo', () => {
  test('503 no exame, e nada escrito em lugar nenhum', async () => {
    const fakes = buildFakes({ encodedEncryptionKey: '' });
    const response = await upload(createClient(fakes.useCases), { kind: 'exame', bytes: PDF });

    expect(response.status).toBe(503);
    expect(readErrorCode(response)).toBe(ERROR_CODES.media.KEY_INVALID);
    expect(fakes.rows).toHaveLength(0);
    expect(fakes.objects.size).toBe(0);
  });

  /** A chave e' lida so quando um exame aparece: quem quer subir foto nao tem nada com ela. */
  test('a foto nao depende da chave do exame', async () => {
    const fakes = buildFakes({ encodedEncryptionKey: '' });
    const response = await upload(createClient(fakes.useCases));

    expect(response.status).toBe(201);
    expect(fakes.objects.size).toBe(1);
  });
});

describe('o filho do caminho tem de ser deste pai', () => {
  /**
   * 404, e nao 403, byte a byte a resposta do modulo `Child`: segmento de URL e'
   * o que um atacante enumera, e 403 confirmaria que o filho de outro pai
   * existe. (`Activity` responde 403 porque la o `childId` vem no CORPO.)
   */
  test('filho de outro pai responde 404, e nao 403', async () => {
    const fakes = buildFakes();
    const response = await upload(createClient(fakes.useCases), { childId: FOREIGN_CHILD_ID });

    expect(response.status).toBe(404);
    expect(readErrorCode(response)).toBe(ERROR_CODES.child.CHILD_NOT_FOUND);
  });

  test('o dono e checado ANTES de qualquer byte ser lido ou guardado', async () => {
    const fakes = buildFakes();
    await upload(createClient(fakes.useCases), { childId: FOREIGN_CHILD_ID, kind: 'exame', bytes: PDF });

    expect(fakes.rows).toHaveLength(0);
    expect(fakes.objects.size).toBe(0);
    expect(fakes.trail).toHaveLength(0);
  });
});

describe('o tipo se decide pelos bytes', () => {
  test('bytes que nao sabemos nomear sao recusados com 415', async () => {
    const fakes = buildFakes();
    const response = await upload(createClient(fakes.useCases), { bytes: DESCONHECIDO });

    expect(response.status).toBe(415);
    expect(readErrorCode(response)).toBe(ERROR_CODES.childFile.CHILD_FILE_TYPE_UNKNOWN);
  });

  /** PDF entrando como `foto` viraria um quadrado quebrado no album. */
  test('PDF nao entra como foto', async () => {
    const fakes = buildFakes();
    const response = await upload(createClient(fakes.useCases), { kind: 'foto', bytes: PDF });

    expect(response.status).toBe(415);
    expect(readErrorCode(response)).toBe(ERROR_CODES.childFile.CHILD_FILE_TYPE_NOT_ALLOWED);
  });

  test('tipo de arquivo recusado nao deixa linha nem byte', async () => {
    const fakes = buildFakes();
    await upload(createClient(fakes.useCases), { bytes: DESCONHECIDO });

    expect(fakes.rows).toHaveLength(0);
    expect(fakes.objects.size).toBe(0);
  });
});

describe('o teto de tamanho e um numero, checado duas vezes', () => {
  /**
   * A DECISAO e' o tamanho real dos bytes. O `Content-Length` e' cabecalho
   * escrito pelo cliente, e portanto nunca autoriza nada — so' adianta a recusa.
   */
  test('o tamanho real manda, mesmo com o cabecalho calado', async () => {
    const fakes = buildFakes();
    const grande = new Uint8Array(CHILD_FILE_MAX_BYTES + 1);
    grande.set(JPEG);

    const promessa = fakes.useCases.upload({
      childId: OWNED_CHILD_ID,
      userId: TEST_USER_ID,
      kind: 'foto',
      bytes: grande,
      clientIp: CLIENT_IP,
    });

    await expect(promessa).rejects.toThrow(/15 MB/);
    expect(fakes.rows).toHaveLength(0);
  });

  /** A checagem barata existe para nao ler 300 MB antes de recusar. */
  test('cabecalho absurdo recusa antes de ler o corpo', async () => {
    const fakes = buildFakes();
    const response = await upload(createClient(fakes.useCases), {
      headers: { 'content-length': String(CHILD_FILE_MAX_BYTES * 20) },
    });

    expect(response.status).toBe(413);
    expect(readErrorCode(response)).toBe(ERROR_CODES.childFile.CHILD_FILE_TOO_LARGE);
  });

  /**
   * O envelope do multipart faz o `Content-Length` passar do tamanho do arquivo.
   * Sem a folga, a checagem barata seria MAIS severa que a regra, e um arquivo
   * de exatamente 15 MB seria recusado por causa da linha de fronteira.
   */
  test('a folga do multipart nao deixa a checagem barata ser mais severa que a regra', async () => {
    const fakes = buildFakes();
    const response = await upload(createClient(fakes.useCases), {
      headers: { 'content-length': String(CHILD_FILE_MAX_BYTES + 200) },
    });

    expect(response.status).toBe(201);
  });
});

describe('o formulario tem de trazer arquivo e tipo', () => {
  test('sem arquivo, 400 dizendo em que campo ele vai', async () => {
    const fakes = buildFakes();
    const response = await upload(createClient(fakes.useCases), { bytes: new Uint8Array() });

    expect(response.status).toBe(400);
    expect(readErrorCode(response)).toBe(ERROR_CODES.childFile.CHILD_FILE_MISSING);
  });

  test('tipo que nao existe e recusado na fronteira', async () => {
    const fakes = buildFakes();
    const response = await upload(createClient(fakes.useCases), { kind: 'video' });

    expect(response.status).toBe(400);
    expect(readErrorCode(response)).toBe(ERROR_CODES.shared.VALIDATION_FAILED);
  });

  /** Corpo que nao e' multipart nao pode virar 500. */
  test('corpo em JSON responde 400 dizendo o formato certo', async () => {
    const fakes = buildFakes();
    const response = await createClient(fakes.useCases).send({
      method: HTTP_METHODS.POST,
      path: `/v1/children/${OWNED_CHILD_ID}/files`,
      body: { kind: 'foto' },
    });

    expect(response.status).toBe(400);
    expect(readErrorCode(response)).toBe(ERROR_CODES.shared.VALIDATION_FAILED);
  });
});

describe('a trilha separa foto de exame', () => {
  /**
   * O relatorio que a autoridade pede e' "quem mexeu em EXAME", nao "quem mexeu
   * em arquivo": um `child_file_written` unico obrigaria a cruzar a trilha com a
   * tabela para responder isso.
   */
  test('exame e foto deixam acoes diferentes', async () => {
    const fakes = buildFakes();
    const client = createClient(fakes.useCases);
    await upload(client);
    await upload(client, { kind: 'exame', bytes: PDF });

    expect(fakes.trail.map((entry) => entry.action)).toEqual([
      AUDIT_ACTIONS.CHILD_PHOTO_UPLOADED,
      AUDIT_ACTIONS.CHILD_EXAM_UPLOADED,
    ]);
  });

  test('a trilha aponta para o arquivo, com o IP que o proxy contou', async () => {
    const fakes = buildFakes();
    const view = readDataRecord(await upload(createClient(fakes.useCases)));

    expect(fakes.trail[0]).toEqual({
      actorId: TEST_USER_ID,
      action: AUDIT_ACTIONS.CHILD_PHOTO_UPLOADED,
      targetType: AUDIT_TARGET_TYPES.CHILD_FILE,
      targetId: String(view.id),
      clientIp: CLIENT_IP,
    });
  });
});

describe('byte orfao e linha orfa nao sobrevivem a uma falha', () => {
  /**
   * A linha entra ANTES do byte de proposito: a interface do balde nao tem
   * `list()`, entao byte sem linha e' invisivel para sempre — e seria dado de
   * saude de crianca sem dono e sem caminho de exclusao.
   */
  test('balde fora do ar nao deixa linha para tras', async () => {
    const fakes = buildFakes({ failOnPut: true });
    const response = await upload(createClient(fakes.useCases));

    expect(response.status).toBe(500);
    expect(fakes.rows).toHaveLength(0);
  });

  /** Trilha por ultimo: ela nunca pode dizer "guardou" sem haver byte guardado. */
  test('balde fora do ar nao escreve trilha', async () => {
    const fakes = buildFakes({ failOnPut: true });
    await upload(createClient(fakes.useCases));

    expect(fakes.trail).toHaveLength(0);
  });
});

/**
 * O pedido do usuario era este: *"vc precisa add esses arquivos para termos no
 * historico"*. Guardar sem listar seria guardar num lugar de onde nada volta —
 * a foto e o exame do MESMO filho saem na MESMA lista, porque e' uma historia
 * so'.
 */
describe('a historia do filho volta em uma lista so', () => {
  test('a foto e o exame do filho saem juntos, na mesma lista', async () => {
    const fakes = buildFakes();
    const client = createClient(fakes.useCases);
    await upload(client, { caption: 'primeiro dia de escola', takenOn: '2026-02-10' });
    await upload(client, { kind: 'exame', bytes: PDF, takenOn: '2026-03-01' });

    const response = await list(client);

    expect(response.status).toBe(200);
    const items = readDataList(response);
    expect(items).toHaveLength(2);
    expect(items.map((item) => item.kind).sort()).toEqual(['exame', 'foto']);
  });

  /**
   * Metadado, nunca byte — e nem o envelope cifrado do exame. A ficha do filho
   * desenha miniatura e data; conteudo de exame e' leitura com trilha propria
   * (`H3.3`), e nao algo que sai de brinde ao abrir a ficha.
   */
  test('a lista nao carrega conteudo nenhum', async () => {
    const fakes = buildFakes();
    const client = createClient(fakes.useCases);
    await upload(client, { kind: 'exame', bytes: PDF });

    const [item] = readDataList(await list(client));

    expect(item).toBeDefined();
    expect(JSON.stringify(item)).not.toContain(MEDIA_ENVELOPE_MAGIC);
    expect(JSON.stringify(item)).not.toContain(LAUDO);
    expect(item?.objectKey).toBeUndefined();
    expect(item?.userId).toBeUndefined();
    expect(item?.isEncrypted).toBeUndefined();
  });

  /** `D6`: a data que a linha do tempo usa e' a do dia da foto, e ela tem de VOLTAR. */
  test('a data do dia da foto volta na lista', async () => {
    const fakes = buildFakes();
    const client = createClient(fakes.useCases);
    await upload(client, { takenOn: '2019-07-14', caption: 'colo do avo' });

    const [item] = readDataList(await list(client));

    expect(item?.takenOn).toBe('2019-07-14');
    expect(item?.caption).toBe('colo do avo');
    expect(item?.checksum).toBe(sha256(JPEG));
  });

  test('o total vem do banco, e a pagina pedida e a que volta', async () => {
    const fakes = buildFakes();
    const client = createClient(fakes.useCases);
    await upload(client);
    await upload(client);
    await upload(client);

    const first = await list(client, { query: '?page=1&perPage=2' });
    const second = await list(client, { query: '?page=2&perPage=2' });

    expect(readDataList(first)).toHaveLength(2);
    expect(readDataList(second)).toHaveLength(1);
    expect(readPagination(first)).toEqual({ total: 3, page: 1, perPage: 2 });
  });

  /**
   * A trilha de auditoria e' para LEITURA de dado de saude (`H3.3`). Carimbar
   * cada abertura da ficha encheria a trilha de linhas que nao contam nada, e
   * afogaria a que conta.
   */
  test('listar nao grava trilha', async () => {
    const fakes = buildFakes();
    const client = createClient(fakes.useCases);
    await upload(client, { kind: 'exame', bytes: PDF });
    const before = fakes.trail.length;

    await list(client);

    expect(fakes.trail).toHaveLength(before);
  });
});

/**
 * BOLA (OWASP API1) na leitura. O `childId` aqui e' segmento de URL — justo o
 * que se enumera —, e a divida que o `H2.2` deixou anotada era esta: provar em
 * HTTP o que o SQL ja garantia.
 */
describe('a lista de outro pai nao tem como voltar', () => {
  test('filho de outro pai responde 404, nao 403', async () => {
    const fakes = buildFakes();
    const response = await list(createClient(fakes.useCases), { childId: FOREIGN_CHILD_ID });

    expect(response.status).toBe(404);
    expect(readErrorCode(response)).toBe(ERROR_CODES.child.CHILD_NOT_FOUND);
  });

  /** Filho compartilhado nao existe no produto; se um dia existir, esta linha reprova. */
  test('arquivo de outro pai no mesmo filho nao aparece', async () => {
    const fakes = buildFakes();
    const client = createClient(fakes.useCases);
    await upload(client, { caption: 'minha' });
    seed(fakes.rows, { id: '99999999-9999-4999-8999-999999999999', userId: OTHER_USER_ID, caption: 'do vizinho' });

    const items = readDataList(await list(client));

    expect(items).toHaveLength(1);
    expect(items[0]?.caption).toBe('minha');
  });

  test('arquivo de outro filho do mesmo pai nao aparece', async () => {
    const fakes = buildFakes();
    const client = createClient(fakes.useCases);
    await upload(client, { caption: 'do filho certo' });
    seed(fakes.rows, { id: '55555555-5555-4555-8555-555555555555', childId: FOREIGN_CHILD_ID });

    const items = readDataList(await list(client));

    expect(items).toHaveLength(1);
    expect(items[0]?.caption).toBe('do filho certo');
  });

  test('childId que nao e uuid nao chega ao banco', async () => {
    const fakes = buildFakes();
    const response = await list(createClient(fakes.useCases), { childId: 'nao-e-uuid' });

    expect(response.status).toBe(400);
    expect(readErrorCode(response)).toBe(ERROR_CODES.shared.VALIDATION_FAILED);
  });
});


describe('a foto sai por link assinado, e a API fica fora do caminho', () => {
  test('a foto responde 302 para o link do balde', async () => {
    const fakes = buildFakes({ canPresign: true });
    const client = createClient(fakes.useCases);
    const fileId = await uploadAndReadId(client);

    const response = await content(client, { fileId });

    expect(response.status).toBe(CHILD_FILE_REDIRECT_STATUS);
    expect(response.headers.get(LOCATION_HEADER)).toContain(SIGNED_LINK_PREFIX);
    expect(response.payload).toBeUndefined();
  });

  /**
   * O prazo e' do modulo de midia, nao um numero escrito nesta rota: link
   * assinado de vida longa e' link publico com data marcada.
   */
  test('o link vence, e o prazo e o do modulo de midia', async () => {
    const fakes = buildFakes({ canPresign: true });
    const client = createClient(fakes.useCases);

    await content(client, { fileId: await uploadAndReadId(client) });

    expect(fakes.presignCalls).toHaveLength(1);
    expect(fakes.presignCalls[0]?.ttlSeconds).toBe(DEFAULT_PRESIGN_TTL_SECONDS);
  });

  /**
   * Album de um fim de semana sao dezenas de aberturas. Carimbar cada uma
   * encheria a trilha do art. 46 de linhas que nao contam nada, afogando a
   * linha do exame — que e' a que a trilha existe para achar.
   */
  test('ler foto nao grava trilha', async () => {
    const fakes = buildFakes({ canPresign: true });
    const client = createClient(fakes.useCases);
    const fileId = await uploadAndReadId(client);

    await content(client, { fileId });
    await content(client, { fileId });

    expect(fakes.trail).toHaveLength(1);
    expect(fakes.trail[0]?.action).toBe(AUDIT_ACTIONS.CHILD_PHOTO_UPLOADED);
  });

  /**
   * Balde de arquivo local nao assina nada, e a foto tem de abrir do mesmo
   * jeito: a capacidade e' opcional por AUSENCIA, e a rota cai nos bytes.
   */
  test('balde que nao sabe assinar entrega os bytes', async () => {
    const fakes = buildFakes();
    const client = createClient(fakes.useCases);
    const fileId = await uploadAndReadId(client);

    const response = await contentBytes(client, { fileId });

    expect(response.status).toBe(200);
    expect(response.headers.get(CONTENT_TYPE_HEADER)).toBe('image/jpeg');
    expect(Buffer.from(response.bytes).equals(Buffer.from(JPEG))).toBe(true);
  });

  test('nem o link nem os bytes podem ficar em cache', async () => {
    const assinando = buildFakes({ canPresign: true });
    const assinandoClient = createClient(assinando.useCases);
    const comLink = await content(assinandoClient, { fileId: await uploadAndReadId(assinandoClient) });

    const servindo = buildFakes();
    const servindoClient = createClient(servindo.useCases);
    const comBytes = await contentBytes(servindoClient, { fileId: await uploadAndReadId(servindoClient) });

    expect(comLink.headers.get(CACHE_CONTROL_HEADER)).toBe(CHILD_FILE_CACHE_CONTROL);
    expect(comBytes.headers.get(CACHE_CONTROL_HEADER)).toBe(CHILD_FILE_CACHE_CONTROL);
  });
});

describe('o exame passa pela API, sempre', () => {
  /**
   * O balde SABE assinar neste teste, e ainda assim nao e' chamado. Link
   * assinado deixa de ser observavel no instante em que e' emitido, e dado de
   * saude de crianca exige trilha em toda leitura (`security.md` §10).
   */
  test('o exame nao sai por link, mesmo com balde que assina', async () => {
    const fakes = buildFakes({ canPresign: true });
    const client = createClient(fakes.useCases);
    const fileId = await uploadAndReadId(client, { kind: 'exame', bytes: PDF });

    const response = await contentBytes(client, { fileId });

    expect(response.status).toBe(200);
    expect(fakes.presignCalls).toHaveLength(0);
  });

  test('o exame volta decifrado, e no balde ele continua cifrado', async () => {
    const fakes = buildFakes();
    const client = createClient(fakes.useCases);
    const fileId = await uploadAndReadId(client, { kind: 'exame', bytes: PDF });

    const response = await contentBytes(client, { fileId });

    expect(response.headers.get(CONTENT_TYPE_HEADER)).toBe('application/pdf');
    expect(Buffer.from(response.bytes).toString('utf8')).toContain(LAUDO);

    const stored = [...fakes.objects.values()][0];
    expect(Buffer.from(stored?.bytes ?? new Uint8Array()).toString('utf8')).toContain(MEDIA_ENVELOPE_MAGIC);
  });

  /** TODA leitura, nao a primeira: duas aberturas sao duas linhas. */
  test('toda leitura de exame grava trilha', async () => {
    const fakes = buildFakes();
    const client = createClient(fakes.useCases);
    const fileId = await uploadAndReadId(client, { kind: 'exame', bytes: PDF });

    await contentBytes(client, { fileId });
    await contentBytes(client, { fileId });

    const leituras = fakes.trail.filter((entry) => entry.action === AUDIT_ACTIONS.CHILD_EXAM_READ);
    expect(leituras).toHaveLength(2);
    expect(leituras[0]).toMatchObject({
      actorId: TEST_USER_ID,
      targetType: AUDIT_TARGET_TYPES.CHILD_FILE,
      targetId: fileId,
      clientIp: CLIENT_IP,
    });
  });

  /** Nome de arquivo e' PII, e este produto nao guarda nenhum para poder mandar. */
  test('o arquivo servido nao carrega nome nenhum', async () => {
    const fakes = buildFakes();
    const client = createClient(fakes.useCases);
    const fileId = await uploadAndReadId(client, { kind: 'exame', bytes: PDF });

    const response = await contentBytes(client, { fileId });

    expect(response.headers.get(CONTENT_DISPOSITION_HEADER)).toBe(CHILD_FILE_CONTENT_DISPOSITION);
    expect(response.headers.get(CONTENT_DISPOSITION_HEADER)).not.toContain('filename');
  });

  /**
   * Instalacao sem chave nao devolve o envelope cru "porque e' o que tem": 503,
   * e trilha VAZIA — nao houve leitura para registrar.
   */
  test('exame sem chave configurada nao vaza, e nao grava trilha', async () => {
    const fakes = buildFakes({ encodedEncryptionKey: '' });
    seed(fakes.rows, { id: MISSING_ID, kind: 'exame', contentType: 'application/pdf', checksum: sha256(PDF) });
    fakes.objects.set(`children/${OWNED_CHILD_ID}/${MISSING_ID}`, {
      objectKey: `children/${OWNED_CHILD_ID}/${MISSING_ID}`,
      bytes: encryptMedia({ plaintext: PDF, key: readMediaKey(KEY) }),
      contentType: 'application/pdf',
    });
    Object.assign(fakes.rows[0] as ChildFileRow, { isEncrypted: true });

    const response = await content(createClient(fakes.useCases), { fileId: MISSING_ID });

    expect(response.status).toBe(503);
    expect(readErrorCode(response)).toBe(ERROR_CODES.media.KEY_INVALID);
    expect(fakes.trail).toHaveLength(0);
  });

  /**
   * O envelope trocado no balde ABRE — foi cifrado com a mesma chave —, e o
   * conteudo e' outro. So o `checksum` do envio percebe, e e' para isso que ele
   * foi guardado. Entregar numero de hemoglobina de outro exame e' pior que nao
   * entregar nada, porque ninguem desconfia de um papel que abriu normalmente.
   */
  test('bytes trocados no balde nao chegam ao pai, e nao viram leitura', async () => {
    const fakes = buildFakes();
    const client = createClient(fakes.useCases);
    const fileId = await uploadAndReadId(client, { kind: 'exame', bytes: PDF });
    const objectKey = `children/${OWNED_CHILD_ID}/${fileId}`;
    const outroLaudo = new Uint8Array(Buffer.from('%PDF-1.4\nHemoglobina: 7,1 g/dL\n', 'utf8'));
    fakes.objects.set(objectKey, {
      objectKey,
      bytes: encryptMedia({ plaintext: outroLaudo, key: readMediaKey(KEY) }),
      contentType: 'application/pdf',
    });
    fakes.trail.length = 0;

    const response = await content(client, { fileId });

    expect(response.status).toBe(500);
    expect(readErrorCode(response)).toBe(ERROR_CODES.childFile.CHILD_FILE_CORRUPTED);
    expect(fakes.trail).toHaveLength(0);
  });
});

describe('conteudo de outro dono nao tem como voltar', () => {
  test('arquivo de outro pai responde 404', async () => {
    const fakes = buildFakes();
    seed(fakes.rows, { id: MISSING_ID, userId: OTHER_USER_ID });

    const response = await content(createClient(fakes.useCases), { fileId: MISSING_ID });

    expect(response.status).toBe(404);
    expect(readErrorCode(response)).toBe(ERROR_CODES.childFile.CHILD_FILE_NOT_FOUND);
  });

  /**
   * Mesmo pai, filho errado no CAMINHO. O `userId` sozinho nao pega este caso —
   * quem pega e' a comparacao do `childId` da linha com o do segmento da URL.
   */
  test('arquivo de outro filho pelo caminho deste filho responde 404', async () => {
    const fakes = buildFakes();
    seed(fakes.rows, { id: MISSING_ID, childId: FOREIGN_CHILD_ID });

    const response = await content(createClient(fakes.useCases), { fileId: MISSING_ID });

    expect(response.status).toBe(404);
    expect(readErrorCode(response)).toBe(ERROR_CODES.childFile.CHILD_FILE_NOT_FOUND);
  });

  test('filho de outro pai responde 404 de filho, nao 403', async () => {
    const fakes = buildFakes();
    const client = createClient(fakes.useCases);
    const fileId = await uploadAndReadId(client);

    const response = await content(client, { fileId, childId: FOREIGN_CHILD_ID });

    expect(response.status).toBe(404);
    expect(readErrorCode(response)).toBe(ERROR_CODES.child.CHILD_NOT_FOUND);
  });

  test('fileId desconhecido responde 404', async () => {
    const fakes = buildFakes();

    const response = await content(createClient(fakes.useCases), { fileId: MISSING_ID });

    expect(response.status).toBe(404);
    expect(readErrorCode(response)).toBe(ERROR_CODES.childFile.CHILD_FILE_NOT_FOUND);
  });

  test('fileId que nao e uuid nao chega ao banco', async () => {
    const fakes = buildFakes();

    const response = await content(createClient(fakes.useCases), { fileId: 'nao-e-uuid' });

    expect(response.status).toBe(400);
    expect(readErrorCode(response)).toBe(ERROR_CODES.shared.VALIDATION_FAILED);
  });

  /**
   * Medido: `../../etc/passwd` no segmento e' normalizado pela propria URL antes
   * de qualquer rota, e o caminho encurtado nao casa com rota nenhuma — 404, sem
   * chegar ao balde. Vale afirmar porque o `objectKey` e' montado com o `fileId`.
   */
  test('subir diretorio no segmento nao alcanca rota nenhuma', async () => {
    const fakes = buildFakes();

    const response = await content(createClient(fakes.useCases), { fileId: '../../etc/passwd' });

    expect(response.status).toBe(404);
    expect(fakes.objects.size).toBe(0);
  });
});

describe('apagar tira os BYTES, e nao so a linha (D5)', () => {
  test('a foto sai do balde e sai da tabela', async () => {
    const fakes = buildFakes();
    const client = createClient(fakes.useCases);
    const fileId = await uploadAndReadId(client);
    expect(fakes.objects.size).toBe(1);

    const response = await remove(client, { fileId });

    expect(response.status).toBe(204);
    /**
     * As DUAS afirmacoes, e nao uma: `ON DELETE CASCADE` limparia a linha e
     * deixaria o objeto — que e' exatamente a violacao que nao quebra teste
     * nenhum se o teste so olhar a tabela.
     */
    expect(fakes.objects.size).toBe(0);
    expect(fakes.rows).toHaveLength(0);
  });

  test('o exame tambem, e o balde fica vazio', async () => {
    const fakes = buildFakes();
    const client = createClient(fakes.useCases);
    const fileId = await uploadAndReadId(client, { kind: 'exame', bytes: PDF });

    expect((await remove(client, { fileId })).status).toBe(204);
    expect(fakes.objects.size).toBe(0);
    expect(fakes.rows).toHaveLength(0);
  });

  /**
   * O art. 18 da' ao pai o direito a eliminacao E o direito a saber o que foi
   * feito com o dado. A linha da tabela desaparece; sem a trilha, nada no
   * sistema sabe que ela existiu.
   */
  test('apagar exame deixa trilha propria', async () => {
    const fakes = buildFakes();
    const client = createClient(fakes.useCases);
    const fileId = await uploadAndReadId(client, { kind: 'exame', bytes: PDF });
    await remove(client, { fileId });

    const deletions = fakes.trail.filter((entry) => entry.action === AUDIT_ACTIONS.CHILD_EXAM_DELETED);
    expect(deletions).toHaveLength(1);
    expect(deletions[0]).toMatchObject({
      actorId: TEST_USER_ID,
      targetType: AUDIT_TARGET_TYPES.CHILD_FILE,
      targetId: fileId,
      clientIp: CLIENT_IP,
    });
  });

  /** A foto nao deixa trilha de LEITURA, mas deixa de apagamento: e' o mesmo art. 18. */
  test('apagar foto deixa trilha, com acao propria', async () => {
    const fakes = buildFakes();
    const client = createClient(fakes.useCases);
    const fileId = await uploadAndReadId(client);
    await remove(client, { fileId });

    const deletions = fakes.trail.filter((entry) => entry.action === AUDIT_ACTIONS.CHILD_PHOTO_DELETED);
    expect(deletions).toHaveLength(1);
    expect(deletions[0]?.targetId).toBe(fileId);
  });

  test('apagar duas vezes o mesmo arquivo responde 404 na segunda', async () => {
    const fakes = buildFakes();
    const client = createClient(fakes.useCases);
    const fileId = await uploadAndReadId(client);

    expect((await remove(client, { fileId })).status).toBe(204);
    const second = await remove(client, { fileId });

    expect(second.status).toBe(404);
    expect(readErrorCode(second)).toBe(ERROR_CODES.childFile.CHILD_FILE_NOT_FOUND);
  });

  /**
   * Falhando o balde, a LINHA fica — de proposito. Linha apontando para nada
   * aparece na listagem e se apaga de novo; objeto sem linha e' dado de saude
   * sem dono, e ninguem consegue mais nomea-lo para eliminar.
   */
  test('balde fora do ar nao apaga a linha, e nao deixa trilha', async () => {
    const fakes = buildFakes({ failOnDelete: true });
    const client = createClient(fakes.useCases);
    const fileId = await uploadAndReadId(client, { kind: 'exame', bytes: PDF });
    const trailBefore = fakes.trail.length;

    const response = await remove(client, { fileId });

    expect(response.status).toBe(500);
    expect(fakes.rows).toHaveLength(1);
    expect(fakes.objects.size).toBe(1);
    expect(fakes.trail).toHaveLength(trailBefore);
  });
});

describe('ninguem apaga arquivo que nao e seu', () => {
  test('arquivo de outro pai responde 404, e o balde fica intacto', async () => {
    const fakes = buildFakes();
    const objectKey = `children/${OWNED_CHILD_ID}/vizinho`;
    seed(fakes.rows, { id: MISSING_ID, userId: OTHER_USER_ID, objectKey });
    fakes.objects.set(objectKey, { objectKey, bytes: JPEG, contentType: 'image/jpeg' });

    const response = await remove(createClient(fakes.useCases), { fileId: MISSING_ID });

    expect(response.status).toBe(404);
    expect(readErrorCode(response)).toBe(ERROR_CODES.childFile.CHILD_FILE_NOT_FOUND);
    expect(fakes.objects.size).toBe(1);
    expect(fakes.rows).toHaveLength(1);
  });

  /** O `userId` blinda contra o pai vizinho; a comparacao de `childId`, contra a troca de segmento. */
  test('arquivo de outro filho pelo caminho deste filho responde 404', async () => {
    const fakes = buildFakes();
    seed(fakes.rows, { id: MISSING_ID, childId: FOREIGN_CHILD_ID });

    const response = await remove(createClient(fakes.useCases), { fileId: MISSING_ID });

    expect(response.status).toBe(404);
    expect(fakes.rows).toHaveLength(1);
  });

  test('filho de outro pai responde 404, nunca 403', async () => {
    const fakes = buildFakes();
    const response = await remove(createClient(fakes.useCases), {
      fileId: MISSING_ID,
      childId: FOREIGN_CHILD_ID,
    });

    expect(response.status).toBe(404);
    expect(readErrorCode(response)).toBe(ERROR_CODES.child.CHILD_NOT_FOUND);
  });

  test('id que nao e uuid nao chega ao balde', async () => {
    const fakes = buildFakes();
    const response = await remove(createClient(fakes.useCases), { fileId: 'nao-e-uuid' });

    expect(response.status).toBe(400);
    expect(readErrorCode(response)).toBe(ERROR_CODES.shared.VALIDATION_FAILED);
  });
});

describe('o exame exige o consentimento do art. 14 §1', () => {
  /**
   * O defeito que este teste impede de voltar: um `403` que sai DEPOIS de a
   * linha e o objeto existirem. A recusa e' sobre tratamento de dado sensivel
   * de menor sem base legal — e o que foi escrito foi tratado, ainda que a
   * resposta diga "nao".
   */
  test('sem consentimento, o exame nao deixa linha, byte nem trilha', async () => {
    const fakes = buildFakes({ consentGranted: false });

    const response = await upload(createClient(fakes.useCases), { kind: 'exame', bytes: PDF });

    expect(response.status).toBe(403);
    expect(readErrorCode(response)).toBe(ERROR_CODES.childFile.CHILD_EXAM_CONSENT_MISSING);
    expect(fakes.rows).toHaveLength(0);
    expect(fakes.objects.size).toBe(0);
    expect(fakes.trail).toHaveLength(0);
  });

  /** Para a FOTO, o consentimento da conta basta (tabela do GOAL). */
  test('a foto sobe sem consentimento especifico', async () => {
    const fakes = buildFakes({ consentGranted: false });

    const response = await upload(createClient(fakes.useCases), { kind: 'foto', bytes: JPEG });

    expect(response.status).toBe(201);
    expect(fakes.rows).toHaveLength(1);
    expect(fakes.objects.size).toBe(1);
  });

  test('com consentimento, o exame sobe cifrado como antes', async () => {
    const fakes = buildFakes({ consentGranted: true });

    const response = await upload(createClient(fakes.useCases), { kind: 'exame', bytes: PDF });

    expect(response.status).toBe(201);
    expect(fakes.rows[0]?.isEncrypted).toBe(true);
    expect(fakes.trail[0]?.action).toBe(AUDIT_ACTIONS.CHILD_EXAM_UPLOADED);
  });

  /**
   * A recusa acontece ANTES do teto de tamanho: um exame gigante e sem
   * consentimento responde pelo consentimento, nao pelo tamanho. Se a ordem se
   * invertesse, o pai corrigiria o tamanho e so' ai descobriria que faltava
   * consentimento — duas idas para uma recusa.
   */
  test('a recusa vem antes do teto de tamanho', async () => {
    const fakes = buildFakes({ consentGranted: false });
    const enorme = new Uint8Array(CHILD_FILE_MAX_BYTES + 1);
    enorme.set(PDF, 0);

    const response = await upload(createClient(fakes.useCases), { kind: 'exame', bytes: enorme });

    expect(response.status).toBe(403);
    expect(readErrorCode(response)).toBe(ERROR_CODES.childFile.CHILD_EXAM_CONSENT_MISSING);
  });

  /** Filho de outro pai continua 404: a posse se afirma antes do consentimento. */
  test('filho de outro pai responde 404, e nao 403 de consentimento', async () => {
    const fakes = buildFakes({ consentGranted: false });

    const response = await upload(createClient(fakes.useCases), {
      kind: 'exame',
      bytes: PDF,
      childId: FOREIGN_CHILD_ID,
    });

    expect(response.status).toBe(404);
    expect(readErrorCode(response)).toBe(ERROR_CODES.child.CHILD_NOT_FOUND);
  });
});

/**
 * `ON DELETE CASCADE` apaga LINHA, e o balde nao e' o Postgres: sem esta
 * varredura, apagar o filho deixaria os bytes no balde para sempre — e
 * `MediaStorage` nao tem `list()` de proposito, entao um objeto cuja linha
 * sumiu e' um objeto que ninguem consegue mais nomear para apagar.
 */
type SeedParams = {
  readonly fakes: Fakes;
  readonly childId: string;
  readonly userId?: string;
};

/**
 * Linha posta a mao: as rotas so' aceitam `OWNED_CHILD_ID`, e o que se afirma
 * nas varreduras e' justamente o arquivo que NAO e' daquele filho.
 */
function seedFile({ fakes, childId, userId = TEST_USER_ID }: SeedParams): string {
  const objectKey = `criancas/${childId}/objeto-${fakes.rows.length}`;
  fakes.objects.set(objectKey, { objectKey, bytes: JPEG, contentType: 'image/jpeg' });
  fakes.rows.push({
    ...buildIdentity(''),
    userId,
    childId,
    kind: 'foto',
    objectKey,
    contentType: 'image/jpeg',
    byteSize: JPEG.byteLength,
    checksum: sha256(JPEG),
    isEncrypted: false,
    caption: null,
    takenOn: null,
  });
  return objectKey;
}

function purge(fakes: Fakes, childId = OWNED_CHILD_ID, userId = TEST_USER_ID) {
  return fakes.useCases.purgeByChild({ childId, userId, clientIp: CLIENT_IP });
}

function purgeUser(fakes: Fakes, userId = TEST_USER_ID) {
  return fakes.useCases.purgeByUser({ userId, clientIp: CLIENT_IP });
}

describe('purgeByChild — apagar o filho leva os BYTES', () => {
  test('foto e exame do filho saem do balde', async () => {
    const fakes = buildFakes();
    const client = createClient(fakes.useCases);
    await upload(client, { kind: 'foto', bytes: JPEG });
    await upload(client, { kind: 'exame', bytes: PDF });
    expect(fakes.objects.size).toBe(2);

    await purge(fakes);

    expect(fakes.objects.size).toBe(0);
  });

  /** O escopo mora na consulta: irmao e' outro `childId`, e nao se toca nele. */
  test('o album do irmao continua no balde', async () => {
    const fakes = buildFakes();
    await upload(createClient(fakes.useCases), { kind: 'foto', bytes: JPEG });
    const irmao = seedFile({ fakes, childId: SIBLING_CHILD_ID });

    await purge(fakes);

    expect(fakes.objects.has(irmao)).toBe(true);
    expect(fakes.objects.size).toBe(1);
  });

  /**
   * O `userId` no `where` e' o que impede o apagamento cruzado (BOLA, OWASP
   * API1): pai que nao e' dono varre o proprio nada.
   */
  test('pai que nao e dono nao apaga byte nenhum', async () => {
    const fakes = buildFakes();
    await upload(createClient(fakes.useCases), { kind: 'foto', bytes: JPEG });

    await purge(fakes, OWNED_CHILD_ID, OTHER_USER_ID);

    expect(fakes.objects.size).toBe(1);
  });

  /**
   * As LINHAS ficam: quem as apaga e' a cascata do banco, uma vez, no
   * `DELETE` do filho. Apagar linha aqui tambem faria a varredura competir com
   * a cascata pela mesma verdade — e a cascata ganha sempre.
   */
  test('as linhas ficam para a cascata do banco', async () => {
    const fakes = buildFakes();
    await upload(createClient(fakes.useCases), { kind: 'foto', bytes: JPEG });

    await purge(fakes);

    expect(fakes.rows).toHaveLength(1);
  });

  /**
   * Trilha do EXAME, e nao de cada foto: o art. 46 pergunta o que aconteceu com
   * dado de saude, e um album de trezentas fotos afogaria a resposta em
   * trezentas linhas que ninguem vai ler.
   */
  test('a trilha registra o exame apagado, e nenhuma foto', async () => {
    const fakes = buildFakes();
    const client = createClient(fakes.useCases);
    await upload(client, { kind: 'foto', bytes: JPEG });
    const exame = readDataRecord(await upload(client, { kind: 'exame', bytes: PDF }));
    fakes.trail.length = 0;

    await purge(fakes);

    expect(fakes.trail).toHaveLength(1);
    expect(fakes.trail[0]).toMatchObject({
      action: AUDIT_ACTIONS.CHILD_EXAM_DELETED,
      targetType: AUDIT_TARGET_TYPES.CHILD_FILE,
      targetId: exame.id,
      clientIp: CLIENT_IP,
    });
  });

  /**
   * Balde fora do ar ESTOURA, e o filho continua no banco: e' a metade
   * recuperavel. A linha sobrevivente ainda nomeia a `objectKey`, entao apagar
   * o filho de novo termina o servico; a ordem inversa deixaria byte orfao.
   */
  test('balde fora do ar estoura, e nao apaga o filho pela metade', async () => {
    const fakes = buildFakes({ failOnDelete: true });
    await upload(createClient(fakes.useCases), { kind: 'foto', bytes: JPEG });

    await expect(purge(fakes)).rejects.toThrow();
  });
});

/**
 * O outro dono da porta: apagar a CONTA. O art. 18 VI e' eliminacao, e conta
 * apagada com exame de crianca ainda no balde nao e' eliminacao — e' um objeto
 * que ninguem mais consegue nomear, porque a linha que sabia a chave foi com a
 * cascata.
 */
describe('purgeByUser — apagar a conta leva os bytes de TODOS os filhos', () => {
  test('o album de cada filho sai do balde', async () => {
    const fakes = buildFakes();
    await upload(createClient(fakes.useCases), { kind: 'foto', bytes: JPEG });
    seedFile({ fakes, childId: SIBLING_CHILD_ID });
    expect(fakes.objects.size).toBe(2);

    await purgeUser(fakes);

    expect(fakes.objects.size).toBe(0);
  });

  /**
   * Ninguem varre balde alheio: o `userId` esta no `where`, e a conta apagada
   * nao alcanca o filho de outro pai (BOLA, OWASP API1).
   */
  test('o arquivo de outro pai continua no balde', async () => {
    const fakes = buildFakes();
    const alheio = seedFile({ fakes, childId: SIBLING_CHILD_ID, userId: OTHER_USER_ID });
    seedFile({ fakes, childId: OWNED_CHILD_ID });

    await purgeUser(fakes);

    expect(fakes.objects.has(alheio)).toBe(true);
    expect(fakes.objects.size).toBe(1);
  });

  test('as linhas ficam para a cascata da conta', async () => {
    const fakes = buildFakes();
    await upload(createClient(fakes.useCases), { kind: 'foto', bytes: JPEG });

    await purgeUser(fakes);

    expect(fakes.rows).toHaveLength(1);
  });

  /** Mesma escolha da varredura do filho: o art. 46 pergunta pelo dado de saude. */
  test('a trilha registra o exame apagado, e nenhuma foto', async () => {
    const fakes = buildFakes();
    const client = createClient(fakes.useCases);
    await upload(client, { kind: 'foto', bytes: JPEG });
    const exame = readDataRecord(await upload(client, { kind: 'exame', bytes: PDF }));
    fakes.trail.length = 0;

    await purgeUser(fakes);

    expect(fakes.trail).toHaveLength(1);
    expect(fakes.trail[0]).toMatchObject({
      action: AUDIT_ACTIONS.CHILD_EXAM_DELETED,
      targetType: AUDIT_TARGET_TYPES.CHILD_FILE,
      targetId: exame.id,
      clientIp: CLIENT_IP,
    });
  });

  /**
   * Balde fora do ar ESTOURA, e a conta continua no banco. Responder 204 com
   * byte de exame para tras diria ao titular que ele foi eliminado — e nao ha'
   * segunda chance: sem a linha, a chave do objeto e' inominavel.
   */
  test('balde fora do ar estoura, e nao apaga a conta pela metade', async () => {
    const fakes = buildFakes({ failOnDelete: true });
    await upload(createClient(fakes.useCases), { kind: 'foto', bytes: JPEG });

    await expect(purgeUser(fakes)).rejects.toThrow();
  });
});
