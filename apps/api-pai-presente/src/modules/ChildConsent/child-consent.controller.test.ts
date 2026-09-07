/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '../Audit/audit.constant';
import type { AuditEntry } from '../Audit/types/audit.types';
import type { ChildOwnershipPort } from '../shared/child-ownership.interface';
import { ERROR_CODES } from '../shared/errors/codes';
import { HTTP_METHODS } from '../shared/http/http.constant';

import { CHILD_CONSENT_PURPOSES } from './child-consent.constant';
import { buildChildConsentRoutes } from './child-consent.controller';
import type { ChildConsentRow } from './child-consent.table';
import { createChildConsentUseCases, type ChildConsentUseCases } from './child-consent.use-case';
import type { ChildConsentAuditPort, ChildConsentRepository } from './types/child-consent.types';

import {
  TEST_USER_ID,
  createTestClient,
  readDataList,
  readDataRecord,
  readErrorCode,
  type TestClient,
} from '../../testing/http-test.util';

const OWNED_CHILD_ID = '77777777-7777-4777-8777-777777777777';
const FOREIGN_CHILD_ID = '88888888-8888-4888-8888-888888888888';
const CLIENT_IP = '203.0.113.7';
const PROXY_HEADERS = { 'x-forwarded-for': CLIENT_IP } as const;
const HEALTH = CHILD_CONSENT_PURPOSES.HEALTH_DATA;

const childOwnership: ChildOwnershipPort = {
  isOwnedByUser: async ({ childId, userId }) =>
    childId === OWNED_CHILD_ID && userId === TEST_USER_ID,
};

type Fakes = {
  readonly useCases: ChildConsentUseCases;
  readonly rows: ChildConsentRow[];
  readonly trail: AuditEntry[];
};

/**
 * A dupla imita o `onConflictDoUpdate` do repositorio: chave
 * `(childId, purpose)`, e conceder de novo ATUALIZA a data em vez de empilhar
 * linha. Uma dupla que inserisse duas linhas deixaria o teste de idempotencia
 * verde sem que o banco fizesse o mesmo — e a restricao de verdade e' medida
 * em `child-consent.table.test.ts`.
 */
function buildFakes(): Fakes {
  const rows: ChildConsentRow[] = [];
  const trail: AuditEntry[] = [];
  let tick = 0;

  function nextInstant(): Date {
    tick += 1;
    return new Date(`2026-01-0${tick}T12:00:00.000Z`);
  }

  function indexOf(childId: string, purpose: string): number {
    return rows.findIndex((row) => row.childId === childId && row.purpose === purpose);
  }

  const repository: ChildConsentRepository = {
    grant: async ({ childId, userId, purpose }) => {
      const position = indexOf(childId, purpose);
      const grantedAt = nextInstant();
      if (position >= 0) {
        const refreshed = { ...(rows[position] as ChildConsentRow), grantedAt };
        rows[position] = refreshed;
        return refreshed;
      }
      const created: ChildConsentRow = {
        id: `consentimento-${rows.length + 1}`,
        createdAt: grantedAt,
        updatedAt: grantedAt,
        userId,
        childId,
        purpose,
        grantedAt,
      };
      rows.push(created);
      return created;
    },
    findOne: async ({ childId, userId, purpose }) =>
      rows.find(
        (row) => row.childId === childId && row.userId === userId && row.purpose === purpose,
      ),
    listByChild: async ({ childId, userId }) =>
      rows.filter((row) => row.childId === childId && row.userId === userId),
    revoke: async ({ childId, userId, purpose }) => {
      const position = rows.findIndex(
        (row) => row.childId === childId && row.userId === userId && row.purpose === purpose,
      );
      if (position < 0) return undefined;
      const [removed] = rows.splice(position, 1);
      return removed;
    },
  };

  const audit: ChildConsentAuditPort = {
    record: async (entry) => {
      trail.push(entry);
    },
  };

  const useCases = createChildConsentUseCases({ repository, childOwnership, audit });
  return { useCases, rows, trail };
}

function createClient(useCases: ChildConsentUseCases): TestClient {
  return createTestClient({ routes: buildChildConsentRoutes(useCases) });
}

type ConsentCallParams = {
  readonly childId?: string;
  /** `string`, e nao a finalidade tipada: o teste de fronteira PRECISA mandar o que a API nao conhece. */
  readonly purpose?: string;
};

function grant(
  client: TestClient,
  { childId = OWNED_CHILD_ID, purpose = HEALTH }: ConsentCallParams = {},
) {
  return client.send({
    method: HTTP_METHODS.POST,
    path: `/v1/children/${childId}/consents`,
    body: { purpose },
    headers: PROXY_HEADERS,
  });
}

function list(client: TestClient, { childId = OWNED_CHILD_ID }: ConsentCallParams = {}) {
  return client.send({ method: HTTP_METHODS.GET, path: `/v1/children/${childId}/consents` });
}

function revoke(
  client: TestClient,
  { childId = OWNED_CHILD_ID, purpose = HEALTH }: ConsentCallParams = {},
) {
  return client.send({
    method: HTTP_METHODS.DELETE,
    path: `/v1/children/${childId}/consents/${purpose}`,
    headers: PROXY_HEADERS,
  });
}

describe('conceder registra a DATA, que e o que o art. 14 §1 cobra', () => {
  test('a concessao responde 201 com a finalidade e a data', async () => {
    const fakes = buildFakes();

    const response = await grant(createClient(fakes.useCases));

    expect(response.status).toBe(201);
    const consent = readDataRecord(response);
    expect(consent.purpose).toBe(HEALTH);
    expect(consent.childId).toBe(OWNED_CHILD_ID);
    expect(typeof consent.grantedAt).toBe('string');
  });

  /**
   * A resposta NAO carrega `userId`: quem pergunta ja e' o dono, e devolver o
   * id do pai numa ficha do filho e' dado a mais sem ninguem precisar dele.
   */
  test('a resposta nao devolve o id do pai', async () => {
    const fakes = buildFakes();

    const consent = readDataRecord(await grant(createClient(fakes.useCases)));

    expect(consent.userId).toBeUndefined();
  });
});

describe('conceder duas vezes e a mesma concessao, com data nova', () => {
  /**
   * O `POST` de consentimento nao pede chave de idempotencia: quem decide e' o
   * `unique(child_id, purpose)`. Sem isso, dois toques no botao da tela do
   * `H5.3` deixariam duas linhas para a mesma finalidade, e a pergunta "desde
   * quando este pai consentiu" passaria a ter duas respostas.
   */
  test('a segunda concessao nao cria linha nova', async () => {
    const fakes = buildFakes();
    const client = createClient(fakes.useCases);

    await grant(client);
    const segunda = await grant(client);

    expect(segunda.status).toBe(201);
    expect(fakes.rows).toHaveLength(1);
  });

  test('a segunda concessao renova a data', async () => {
    const fakes = buildFakes();
    const client = createClient(fakes.useCases);

    const primeira = readDataRecord(await grant(client));
    const segunda = readDataRecord(await grant(client));

    expect(segunda.grantedAt).not.toBe(primeira.grantedAt);
  });
});

describe('a lista mostra o que esta vigente', () => {
  test('sem concessao, a lista vem vazia', async () => {
    const response = await list(createClient(buildFakes().useCases));

    expect(response.status).toBe(200);
    expect(readDataList(response)).toHaveLength(0);
  });

  test('depois de conceder, a finalidade aparece', async () => {
    const client = createClient(buildFakes().useCases);
    await grant(client);

    const items = readDataList(await list(client));

    expect(items).toHaveLength(1);
    expect(items[0]?.purpose).toBe(HEALTH);
  });
});

describe('retirar o consentimento e caminho, nao excecao (art. 8 §5)', () => {
  test('retirar responde 204 e a lista volta a vazia', async () => {
    const client = createClient(buildFakes().useCases);
    await grant(client);

    const response = await revoke(client);

    expect(response.status).toBe(204);
    expect(readDataList(await list(client))).toHaveLength(0);
  });

  /** Retirar o que nao existe e' 404: nada foi apagado, e a trilha nao mente. */
  test('retirar duas vezes responde 404 na segunda', async () => {
    const fakes = buildFakes();
    const client = createClient(fakes.useCases);
    await grant(client);
    await revoke(client);

    const response = await revoke(client);

    expect(response.status).toBe(404);
    expect(readErrorCode(response)).toBe(ERROR_CODES.childConsent.CHILD_CONSENT_NOT_FOUND);
    expect(fakes.trail.filter((entry) => entry.action === AUDIT_ACTIONS.CHILD_CONSENT_REVOKED))
      .toHaveLength(1);
  });
});

describe('a trilha e o historico — a tabela guarda so o estado de hoje', () => {
  /**
   * `child_consents` tem UMA linha por finalidade, e retirar APAGA essa linha.
   * Sem estas duas acoes na trilha, "consentiu em marco, retirou em abril,
   * consentiu de novo em maio" seria indistinguivel de "consentiu em maio" — e
   * e' exatamente isso que o art. 37 manda poder demonstrar.
   */
  test('conceder e retirar deixam as duas acoes, com IP', async () => {
    const fakes = buildFakes();
    const client = createClient(fakes.useCases);

    await grant(client);
    await revoke(client);

    expect(fakes.trail.map((entry) => entry.action)).toEqual([
      AUDIT_ACTIONS.CHILD_CONSENT_GRANTED,
      AUDIT_ACTIONS.CHILD_CONSENT_REVOKED,
    ]);
    expect(fakes.trail[0]?.targetType).toBe(AUDIT_TARGET_TYPES.CHILD_CONSENT);
    expect(fakes.trail[0]?.actorId).toBe(TEST_USER_ID);
    expect(fakes.trail[0]?.clientIp).toBe(CLIENT_IP);
  });

  /** Nenhuma trilha carrega o nome do filho nem texto de laudo (`security.md` §1). */
  test('a trilha aponta por id, nao por conteudo', async () => {
    const fakes = buildFakes();
    await grant(createClient(fakes.useCases));

    expect(JSON.stringify(fakes.trail)).not.toContain(OWNED_CHILD_ID);
  });
});

describe('o filho de outro pai nao existe para esta conta', () => {
  /**
   * 404 nos TRES verbos, e nao 403: o `childId` chega no caminho, e um 403 ali
   * confirmaria a existencia do filho de outra pessoa a quem so' chutou o id.
   */
  test.each([
    ['conceder', grant],
    ['listar', list],
    ['retirar', revoke],
  ])('%s no filho de outro pai responde 404', async (_nome, chamar) => {
    const fakes = buildFakes();

    const response = await chamar(createClient(fakes.useCases), { childId: FOREIGN_CHILD_ID });

    expect(response.status).toBe(404);
    expect(readErrorCode(response)).toBe(ERROR_CODES.child.CHILD_NOT_FOUND);
    expect(fakes.rows).toHaveLength(0);
  });
});

describe('a fronteira valida antes de a regra rodar', () => {
  test('childId que nao e uuid responde 400', async () => {
    const response = await grant(createClient(buildFakes().useCases), { childId: 'nao-e-uuid' });

    expect(response.status).toBe(400);
  });

  /**
   * Finalidade fora do conjunto e' 400, nao uma linha nova: o consentimento e'
   * "para uma finalidade especifica", e finalidade que o cliente inventa nao e'
   * especifica de nada.
   */
  test('finalidade desconhecida responde 400 e nao guarda linha', async () => {
    const fakes = buildFakes();

    const response = await grant(createClient(fakes.useCases), { purpose: 'qualquer_coisa' });

    expect(response.status).toBe(400);
    expect(fakes.rows).toHaveLength(0);
  });

  test('retirar finalidade desconhecida tambem responde 400', async () => {
    const response = await revoke(createClient(buildFakes().useCases), {
      purpose: 'qualquer_coisa',
    });

    expect(response.status).toBe(400);
  });
});
