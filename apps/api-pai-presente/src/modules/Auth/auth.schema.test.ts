/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { PASSWORD_MIN_LENGTH } from './auth.constant';
import { registerWithPasswordSchema, signInSchema } from './auth.schema';

const SENHA_VALIDA = 'segredo-comprido-1';

describe('a uniao separa o que cada provedor exige', () => {
  test('google entra por token', () => {
    const body = signInSchema.parse({ provider: 'google', idToken: 'id-token-valido' });
    expect(body).toEqual({ provider: 'google', idToken: 'id-token-valido' });
  });

  /**
   * Sem a uniao, `senha` ausente chegaria ao caso de uso como `undefined` e a
   * decisao de recusar migraria da fronteira para dentro do dominio.
   */
  test('senha sem senha e recusado na fronteira', () => {
    expect(signInSchema.safeParse({ provider: 'password', email: 'ana@exemplo.com' }).success).toBe(false);
  });

  test('senha nao aceita idToken no lugar da senha', () => {
    expect(signInSchema.safeParse({ provider: 'password', idToken: 'qualquer-coisa' }).success).toBe(false);
  });

  test('provedor desconhecido nao passa', () => {
    expect(signInSchema.safeParse({ provider: 'facebook', idToken: 'x' }).success).toBe(false);
  });
});

describe('o e-mail e normalizado antes de ser validado', () => {
  /**
   * Medido: `z.email()` sozinho recusa " ana@exemplo.com " pelo espaco. Quem
   * digita no celular manda espaco, e o teclado ainda oferece maiuscula na
   * primeira letra.
   */
  test('espaco em volta nao reprova', () => {
    const body = signInSchema.parse({ provider: 'password', email: '  ana@exemplo.com ', password: SENHA_VALIDA });
    expect(body).toMatchObject({ email: 'ana@exemplo.com' });
  });

  test('maiuscula vira minuscula, para ser a MESMA conta', () => {
    const body = registerWithPasswordSchema.parse({ email: 'Ana@Exemplo.COM', password: SENHA_VALIDA });
    expect(body.email).toBe('ana@exemplo.com');
  });

  test('texto que nao e e-mail continua sendo recusado', () => {
    expect(registerWithPasswordSchema.safeParse({ email: 'ana', password: SENHA_VALIDA }).success).toBe(false);
  });
});

describe('a senha tem piso, e o piso e o do ASVS L2', () => {
  test('doze e o minimo declarado', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(12);
  });

  test('um caractere abaixo do piso reprova', () => {
    const curta = 'a'.repeat(PASSWORD_MIN_LENGTH - 1);
    expect(registerWithPasswordSchema.safeParse({ email: 'ana@exemplo.com', password: curta }).success).toBe(false);
  });

  test('exatamente o piso passa', () => {
    const noPiso = 'a'.repeat(PASSWORD_MIN_LENGTH);
    expect(registerWithPasswordSchema.safeParse({ email: 'ana@exemplo.com', password: noPiso }).success).toBe(true);
  });

  /** Espaco e caractere de senha: cortar gravaria uma senha e exigiria outra. */
  test('a senha nao e aparada', () => {
    const comEspaco = ` ${SENHA_VALIDA} `;
    const body = registerWithPasswordSchema.parse({ email: 'ana@exemplo.com', password: comEspaco });
    expect(body.password).toBe(comEspaco);
  });

  /** Hash de senha gigante e negacao de servico barata. */
  test('senha absurda tem teto', () => {
    const gigante = 'a'.repeat(1000);
    expect(registerWithPasswordSchema.safeParse({ email: 'ana@exemplo.com', password: gigante }).success).toBe(false);
  });
});

describe('o cadastro nao aceita campo que ninguem pediu', () => {
  test('campo extra reprova', () => {
    const corpo = { email: 'ana@exemplo.com', password: SENHA_VALIDA, isAdmin: true };
    expect(registerWithPasswordSchema.safeParse(corpo).success).toBe(false);
  });

  test('o nome e opcional', () => {
    const body = registerWithPasswordSchema.parse({ email: 'ana@exemplo.com', password: SENHA_VALIDA, fullName: 'Ana' });
    expect(body.fullName).toBe('Ana');
  });
});
