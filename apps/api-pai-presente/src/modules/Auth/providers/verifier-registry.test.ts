/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { DEVELOPMENT_AUTH_PROVIDER } from '../auth.constant';
import { createIdentityVerifierRegistry } from './verifier-registry';

const NO_CLIENT_IDS = {} as const;
const GOOGLE_ONLY = { google: 'cliente-de-teste.apps.googleusercontent.com' } as const;

describe('registro de verificadores', () => {
  /**
   * Medido em 05/09/2026: `bun src/main.ts` morria com "nenhum provedor de login
   * configurado". Falhar fechado esta CERTO em producao — e era o unico caminho,
   * entao ninguem conseguia desenvolver sem uma conta no Google Cloud.
   */
  test('da para desenvolver sem credencial de OAuth', async () => {
    const registry = createIdentityVerifierRegistry({
      clientIds: NO_CLIENT_IDS,
      developmentSignIn: { isEnabled: true, isProduction: false },
    });

    const identity = await registry.forProvider(DEVELOPMENT_AUTH_PROVIDER)?.verify('pai@teste.dev');

    expect(identity?.email).toBe('pai@teste.dev');
  });

  /** O atalho de desenvolvimento em producao e porta aberta, nao conveniencia. */
  test('ligado em producao, o boot morre', () => {
    expect(() =>
      createIdentityVerifierRegistry({
        clientIds: GOOGLE_ONLY,
        developmentSignIn: { isEnabled: true, isProduction: true },
      }),
    ).toThrow(/producao/);
  });

  test('desligado, o provedor de desenvolvimento nao existe', () => {
    const registry = createIdentityVerifierRegistry({
      clientIds: GOOGLE_ONLY,
      developmentSignIn: { isEnabled: false, isProduction: false },
    });

    expect(registry.forProvider(DEVELOPMENT_AUTH_PROVIDER)).toBeUndefined();
    expect(registry.forProvider('google')).toBeDefined();
  });

  test('sem provedor nenhum, o boot continua morrendo', () => {
    expect(() =>
      createIdentityVerifierRegistry({
        clientIds: NO_CLIENT_IDS,
        developmentSignIn: { isEnabled: false, isProduction: false },
      }),
    ).toThrow(/nenhum provedor/);
  });

  test('o token de desenvolvimento precisa ser um email', () => {
    const registry = createIdentityVerifierRegistry({
      clientIds: NO_CLIENT_IDS,
      developmentSignIn: { isEnabled: true, isProduction: false },
    });

    expect(registry.forProvider(DEVELOPMENT_AUTH_PROVIDER)?.verify('qualquer-coisa')).rejects.toThrow();
  });

  test('o nome vai depois do email, para o seed nascer com pai de nome', async () => {
    const registry = createIdentityVerifierRegistry({
      clientIds: NO_CLIENT_IDS,
      developmentSignIn: { isEnabled: true, isProduction: false },
    });

    const identity = await registry
      .forProvider(DEVELOPMENT_AUTH_PROVIDER)
      ?.verify('pai@teste.dev|Joao da Silva');

    expect(identity).toMatchObject({ email: 'pai@teste.dev', fullName: 'Joao da Silva' });
  });
});
