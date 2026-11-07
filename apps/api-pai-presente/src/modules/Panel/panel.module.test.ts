/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { USER_ERROR_CODE } from '@adatechnology/user-contracts';

import { listSdkMigrations } from '../../database/sdk-migrations';
import { withTrackRateLimit } from '../Recommendation/recommendation.module';
import { createRateLimiter } from '../shared/http/rate-limit';
import { PANEL_SCOPES } from './panel.constant';
import { createPanelAuthResolver, ensureFirstAdmin, scopesForRole } from './panel.module';

describe('papeis da equipe', () => {
  test('admin cria acessos; editor nao; viewer so le', () => {
    expect(scopesForRole('admin')).toContain(PANEL_SCOPES.USERS_ADMIN);
    expect(scopesForRole('editor')).not.toContain(PANEL_SCOPES.USERS_ADMIN);
    expect(scopesForRole('editor')).toContain(PANEL_SCOPES.RECOMMENDATIONS_ADMIN);
    expect(scopesForRole('viewer')).toEqual([PANEL_SCOPES.READ, PANEL_SCOPES.CUSTOMERS_READ]);
  });

  test('papel desconhecido nao ganha escopo nenhum', () => {
    expect(scopesForRole('superadmin')).toEqual([]);
  });
});

describe('sessao da equipe', () => {
  const resolver = createPanelAuthResolver({
    async verifyAccessToken(token) {
      return token === 'valido' ? { sub: 'u1', email: 'e@x.dev', role: 'editor' } : undefined;
    },
  });

  test('so aceita Bearer valido', async () => {
    expect(await resolver.resolve({ headers: {} })).toBeUndefined();
    expect(await resolver.resolve({ headers: { authorization: 'Bearer invalido' } })).toBeUndefined();
    expect(await resolver.resolve({ headers: { cookie: 'pp_access=qualquer' } })).toBeUndefined();
    const auth = await resolver.resolve({ headers: { authorization: 'Bearer valido' } });
    expect(auth?.userId).toBe('u1');
    expect(auth?.scopes).toContain(PANEL_SCOPES.RECOMMENDATIONS_ADMIN);
  });
});

describe('migrations do SDK', () => {
  test('usuarios, depois anunciantes, depois recomendacoes, cada um com journal proprio', () => {
    const migrations = listSdkMigrations('/pasta-que-nao-existe');
    expect(migrations.map((migration) => migration.name)).toEqual([
      'user-module',
      'customer-module',
      'recommendation-module',
    ]);
    expect(new Set(migrations.map((migration) => migration.table)).size).toBe(3);
  });
});

describe('rastreio de recomendacao', () => {
  test('a cota e por pai e so vale para o rastreio', async () => {
    const calls: string[] = [];
    const routes = withTrackRateLimit(
      [
        { method: 'POST', path: '/e', scope: 'user', operationId: 'trackRecommendationEvent', summary: '', handler: async () => (calls.push('track'), { kind: 'empty', status: 204 }) },
        { method: 'GET', path: '/f', scope: 'user', operationId: 'getRecommendationFeed', summary: '', handler: async () => (calls.push('feed'), { kind: 'empty', status: 200 }) },
      ],
      createRateLimiter({ maxRequests: 1, windowSeconds: 60 }),
    );
    const context = { params: {}, query: {}, body: undefined, headers: {}, auth: { companyId: 'x', userId: 'pai', scopes: [] } };
    await routes[0]?.handler(context);
    await expect(routes[0]!.handler(context)).rejects.toThrow();
    await routes[1]?.handler(context);
    await routes[1]?.handler(context);
    expect(calls).toEqual(['track', 'feed', 'feed']);
  });
});

describe('primeiro acesso e recuperacao do admin', () => {
  const ADMIN = { email: 'admin@exemplo.dev', password: 'senha-nova-bem-longa' };
  const alreadyExists = Object.assign(new Error('existe'), { code: USER_ERROR_CODE.EMAIL_ALREADY_EXISTS });

  function fakes(createError?: Error) {
    const calls = { created: 0, resets: [] as { email: string; password: string }[] };
    return {
      calls,
      createUser: async () => {
        calls.created += 1;
        if (createError) throw createError;
      },
      resetAdminPassword: async (input: { email: string; password: string }) => {
        calls.resets.push(input);
        return 1;
      },
    };
  }

  test('sem a flag, admin que ja existe fica com a senha que tinha', async () => {
    const deps = fakes(alreadyExists);
    await ensureFirstAdmin({ ...deps, firstAdmin: ADMIN });
    expect(deps.calls.resets).toEqual([]);
  });

  test('com a flag, admin que ja existe ganha a senha da variavel', async () => {
    const deps = fakes(alreadyExists);
    await ensureFirstAdmin({ ...deps, firstAdmin: { ...ADMIN, resetPassword: true } });
    expect(deps.calls.resets).toEqual([ADMIN]);
  });

  test('admin novo e criado e nao precisa de reset', async () => {
    const deps = fakes();
    await ensureFirstAdmin({ ...deps, firstAdmin: { ...ADMIN, resetPassword: true } });
    expect(deps.calls.created).toBe(1);
    expect(deps.calls.resets).toEqual([]);
  });

  test('lista separada por virgula cria cada admin e reseta os que ja existem', async () => {
    const created: string[] = [];
    const resets: string[] = [];
    await ensureFirstAdmin({
      firstAdmin: { email: ' a@x.dev , b@x.dev ', password: ADMIN.password, resetPassword: true },
      createUser: async (input) => {
        created.push(input.email);
        if (input.email === 'a@x.dev') throw alreadyExists;
      },
      resetAdminPassword: async (input) => (resets.push(input.email), 1),
    });
    expect(created).toEqual(['a@x.dev', 'b@x.dev']);
    expect(resets).toEqual(['a@x.dev']);
  });

  test('sem e-mail ou senha nao faz nada', async () => {
    const empty = fakes();
    await ensureFirstAdmin({ ...empty, firstAdmin: { email: '', password: '', resetPassword: true } });
    expect(empty.calls.created).toBe(0);
  });

  test('senha curta nao cria nem reseta ninguem, e nao derruba o boot', async () => {
    const deps = fakes(alreadyExists);
    await ensureFirstAdmin({ ...deps, firstAdmin: { ...ADMIN, password: 'curta', resetPassword: true } });
    expect(deps.calls.created).toBe(0);
    expect(deps.calls.resets).toEqual([]);
  });

  test('erro num acesso nao derruba o boot nem impede o proximo', async () => {
    const created: string[] = [];
    await ensureFirstAdmin({
      firstAdmin: { email: 'quebrado@x.dev,b@x.dev', password: ADMIN.password },
      createUser: async (input) => {
        created.push(input.email);
        if (input.email === 'quebrado@x.dev') throw new Error('banco fora');
      },
      resetAdminPassword: async () => 1,
    });
    expect(created).toEqual(['quebrado@x.dev', 'b@x.dev']);
  });

  test('aspas coladas junto com o valor saem do e-mail e da senha', async () => {
    const seen: { email: string; password: string }[] = [];
    await ensureFirstAdmin({
      firstAdmin: { email: '"a@x.dev,b@x.dev"', password: `"${ADMIN.password}"` },
      createUser: async (input) => void seen.push({ email: input.email, password: input.password }),
      resetAdminPassword: async () => 1,
    });
    expect(seen).toEqual([
      { email: 'a@x.dev', password: ADMIN.password },
      { email: 'b@x.dev', password: ADMIN.password },
    ]);
  });
});
