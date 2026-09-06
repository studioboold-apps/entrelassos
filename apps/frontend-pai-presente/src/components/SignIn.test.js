/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { LOCALE_MESSAGES } from '@/locales';

/**
 * Nao ha biblioteca de DOM neste projeto: modulo puro ganha teste de verdade
 * (`sign-in-form.test.js`), e tela ganha teste de LIGACAO, lendo a fonte. O que
 * se afirma aqui e' que a entrada por senha existe, chega ao hook, e nao
 * reescreve regra que ja tem dono.
 */
const PAGE = readFileSync(join(import.meta.dir, 'SignIn.jsx'), 'utf8');
const HOOK = readFileSync(join(import.meta.dir, '../lib/use-sign-in.js'), 'utf8');

describe('a porta de e-mail e senha existe na tela', () => {
  /**
   * Medido em 05/09: com `D7` pendente, `VITE_GOOGLE_CLIENT_ID` e' vazio, os
   * dois blocos federados nao renderizam e a tela publicada nao tinha NENHUM
   * jeito de entrar. App publicado e inalcancavel e' app que nao existe.
   */
  test('os tres campos estao na tela, fora de qualquer condicional de provedor', () => {
    ['name="email"', 'name="password"', 'name="fullName"'].forEach((field) =>
      expect(PAGE).toContain(field),
    );
  });

  test('o formulario envia pelo hook, nao por chamada propria', () => {
    expect(PAGE).toContain('onSubmit={handleSubmit}');
    expect(PAGE).not.toContain('api.');
  });

  /** `web.md` §4: a tela desenha, o hook decide. */
  test('a tela nao guarda estado de formulario', () => {
    expect(PAGE).not.toContain('useState');
  });

  /**
   * `noValidate` porque a validacao e' a nossa, com frase traduzida ancorada no
   * campo; a bolha do navegador vem no idioma do sistema e ignora o piso da API.
   */
  test('a validacao do navegador nao concorre com a nossa', () => {
    expect(PAGE).toContain('noValidate');
  });
});

describe('o erro mora no campo (web.md §11)', () => {
  test('o campo errado se marca e aponta para a frase', () => {
    expect(PAGE).toContain('aria-invalid');
    expect(PAGE).toContain('aria-describedby');
    expect(PAGE).toContain('role="alert"');
  });

  /** Editar o campo apaga o erro DELE — aviso velho acusa o que ja foi corrigido. */
  test('editar o campo limpa o erro dele', () => {
    expect(HOOK).toContain('Object.hasOwn(current, name)');
  });
});

describe('a recusa da entrada continua uniforme', () => {
  /**
   * A API responde o MESMO 401 para senha errada e para e-mail que nao existe,
   * de proposito: distinguir os dois entrega a lista de quem tem conta. Detalhar
   * aqui desfaria isso do lado do cliente, que e' o lado que o atacante le.
   */
  test('so o cadastro olha o codigo da recusa', () => {
    const [, afterCode] = HOOK.split('AUTH_EMAIL_ALREADY_REGISTERED');
    expect(afterCode).toContain('isRegistering && failure?.code');
  });

  test('a entrada por senha vai como provedor declarado', () => {
    expect(HOOK).toContain("PASSWORD_PROVIDER = 'password'");
    expect(HOOK).toContain('provider: PASSWORD_PROVIDER');
  });

  test('cadastrar entra pelo caminho de cadastro, nao pelo de sessao', () => {
    expect(HOOK).toContain('await register({ email, password, fullName })');
  });
});

describe('o texto e coletavel (web.md §6)', () => {
  /**
   * `docs/DEBITO.md`: esta tela devia sete frases cravadas no JSX. Elas passavam
   * em todo teste e sumiam do `pt-BR` para fora — idioma novo nasce faltando
   * linha, e nada quebra para avisar.
   */
  test('nenhuma frase com acento sobrou cravada no JSX', () => {
    const accented = PAGE.match(/['"`][^'"`\n]*[áàâãéêíóôõúüç][^'"`\n]*['"`]/gi) ?? [];
    expect(accented).toEqual([]);
  });

  test('o escopo entrou no registro de traducoes', () => {
    expect(Object.hasOwn(LOCALE_MESSAGES, 'signIn')).toBe(true);
  });

  /** O piso da senha e' argumento NOMEADO: em outro idioma o numero muda de lugar. */
  test('o piso da senha entra na frase por argumento nomeado', () => {
    expect(LOCALE_MESSAGES.signIn.errors.passwordShort).toContain('{count}');
    expect(PAGE).toContain('count: PASSWORD_MIN_LENGTH');
  });
});

describe('a area de toque respeita o minimo de 44px (web.md §10)', () => {
  test('campo, botao e aba nascem com a altura minima', () => {
    /** Dois campos, o botao de enviar, e as duas abas de modo. */
    expect(PAGE.match(/min-h-11/g)?.length ?? 0).toBeGreaterThanOrEqual(4);
  });
});
