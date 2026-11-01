/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { beforeEach, describe, expect, test } from 'bun:test';

import { createTestClient, readData, readDataRecord, type TestClient } from '../../testing/http-test.util';
import { AUDIT_ACTIONS } from '../Audit/audit.constant';
import type { AuditEntry } from '../Audit/types/audit.types';
import { HTTP_METHODS } from '../shared/http/http.constant';
import {
  FAMILY_VALUE_KINDS,
  FAMILY_VALUE_OPTIONS_PATH,
  FAMILY_VALUES_PATH,
  type FamilyValueKind,
} from './family-values.constant';
import { buildFamilyValuesRoutes } from './family-values.controller';
import { normalizeFamilyValueKey, tidyFamilyValueLabel } from './family-values.normalize';
import { createFamilyValuesUseCases } from './family-values.use-case';
import type { FamilyValuesRepository } from './types/family-values.types';

/** Vocabulario e escolhas em memoria, com a mesma regra de chave normalizada do banco. */
function createFakeRepository(): FamilyValuesRepository & { readonly options: Map<string, string> } {
  const options = new Map<string, string>([[`${FAMILY_VALUE_KINDS.RELIGION}:catolica`, 'Católica']]);
  const choices = new Map<string, { kind: FamilyValueKind; optionKey: string; grantedAt: Date }>();
  return {
    options,
    async findByUser() {
      return [...choices.values()].map(({ kind, optionKey, grantedAt }) => ({
        kind,
        label: options.get(optionKey) ?? '',
        grantedAt,
      }));
    },
    async replace({ choices: next }) {
      for (const kind of [...choices.keys()]) {
        if (!next.some((choice) => choice.kind === kind)) choices.delete(kind);
      }
      for (const { kind, label } of next) {
        const optionKey = `${kind}:${normalizeFamilyValueKey(label)}`;
        if (!options.has(optionKey)) options.set(optionKey, tidyFamilyValueLabel(label));
        choices.set(kind, { kind, optionKey, grantedAt: choices.get(kind)?.grantedAt ?? new Date() });
      }
    },
    async removeAll() {
      const removed = choices.size;
      choices.clear();
      return removed;
    },
    async listOptions(kind) {
      return [...options.entries()].filter(([key]) => key.startsWith(`${kind}:`)).map(([, label]) => label);
    },
  };
}

let client: TestClient;
let repository: ReturnType<typeof createFakeRepository>;
let audited: AuditEntry[];

beforeEach(() => {
  repository = createFakeRepository();
  audited = [];
  const useCases = createFamilyValuesUseCases({
    repository,
    audit: { record: async (entry) => void audited.push(entry) },
  });
  client = createTestClient({ routes: buildFamilyValuesRoutes(useCases) });
});

const ALL_BLANK = { religion: null, politics: null, orientation: null };

describe('valores da familia (dado sensivel, art. 11)', () => {
  test('sem o aceite marcado, nada e gravado: 400', async () => {
    const response = await client.send({
      method: HTTP_METHODS.PUT,
      path: FAMILY_VALUES_PATH,
      body: { ...ALL_BLANK, religion: 'Católica' },
    });
    expect(response.status).toBe(400);
    expect(audited).toHaveLength(0);
  });

  test('grava com aceite, devolve o que ficou e deixa trilha', async () => {
    const response = await client.send({
      method: HTTP_METHODS.PUT,
      path: FAMILY_VALUES_PATH,
      body: { ...ALL_BLANK, consent: true, religion: 'Católica', politics: '  ' },
    });
    expect(response.status).toBe(200);
    const saved = readDataRecord(response);
    expect(saved.religion).toBe('Católica');
    expect(saved.politics).toBeNull();
    expect(saved.consentGrantedAt).not.toBeNull();
    expect(audited.map((entry) => entry.action)).toEqual([AUDIT_ACTIONS.FAMILY_VALUES_SAVED]);
  });

  test('"catolica" sem acento reaproveita a opcao "Católica": nada de duplicata', async () => {
    await client.send({
      method: HTTP_METHODS.PUT,
      path: FAMILY_VALUES_PATH,
      body: { ...ALL_BLANK, consent: true, religion: '  CATOLICA ' },
    });
    const mine = readDataRecord(await client.send({ method: HTTP_METHODS.GET, path: FAMILY_VALUES_PATH }));
    expect(mine.religion).toBe('Católica');
    expect(repository.options.size).toBe(1);
  });

  test('apagar retira o aceite e esvazia tudo', async () => {
    await client.send({
      method: HTTP_METHODS.PUT,
      path: FAMILY_VALUES_PATH,
      body: { ...ALL_BLANK, consent: true, orientation: 'Gay' },
    });
    const removed = await client.send({ method: HTTP_METHODS.DELETE, path: FAMILY_VALUES_PATH });
    expect(removed.status).toBe(204);
    const mine = readDataRecord(await client.send({ method: HTTP_METHODS.GET, path: FAMILY_VALUES_PATH }));
    expect(mine).toEqual({ ...ALL_BLANK, consentGrantedAt: null });
    expect(audited.at(-1)?.action).toBe(AUDIT_ACTIONS.FAMILY_VALUES_DELETED);
  });

  test('as sugestoes vem por tipo, e tipo desconhecido e 400', async () => {
    const ok = await client.send({
      method: HTTP_METHODS.GET,
      path: `${FAMILY_VALUE_OPTIONS_PATH}?kind=${FAMILY_VALUE_KINDS.RELIGION}`,
    });
    expect(readData(ok)).toEqual(['Católica']);
    const bad = await client.send({ method: HTTP_METHODS.GET, path: `${FAMILY_VALUE_OPTIONS_PATH}?kind=time` });
    expect(bad.status).toBe(400);
  });
});
