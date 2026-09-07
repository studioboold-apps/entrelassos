/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { afterEach, describe, expect, test } from 'bun:test';

import { ApiError, requestUpload } from './http';

const PATH = '/v1/children/c-1/files';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function jsonResponse(body, status = 201) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function buildForm() {
  const form = new FormData();
  form.append('file', new Blob(['bytes'], { type: 'image/jpeg' }), 'foto.jpg');
  form.append('kind', 'foto');
  return form;
}

function recordCalls(responses) {
  const calls = [];
  globalThis.fetch = (url, init) => {
    calls.push({ url, init });
    return Promise.resolve(responses[calls.length - 1] ?? jsonResponse({ data: {} }));
  };
  return calls;
}

describe('o arquivo sai como multipart, nao como JSON', () => {
  /**
   * `send` serializa todo corpo definido: um `File` atravessando
   * `JSON.stringify` chega na API como `{}` — sem erro nenhum, so' sem o
   * arquivo. Era o defeito mais silencioso possivel, porque a resposta seria
   * 400 falando de campo, nunca de arquivo perdido.
   */
  test('o corpo e o proprio FormData', async () => {
    const calls = recordCalls([jsonResponse({ data: { id: 'f-1' } })]);
    const form = buildForm();

    await requestUpload(PATH, { form });

    expect(calls).toHaveLength(1);
    expect(calls[0].init.body).toBe(form);
    expect(calls[0].init.method).toBe('POST');
  });

  /**
   * Quem monta o cabecalho e' o navegador, porque so' ele conhece a fronteira
   * (`boundary`) que separa as partes. Escrever `multipart/form-data` a mao
   * apaga a fronteira, e a API recebe um corpo que nao sabe ler.
   */
  test('nenhum Content-Type e escrito a mao', async () => {
    const calls = recordCalls([jsonResponse({ data: { id: 'f-1' } })]);

    await requestUpload(PATH, { form: buildForm() });

    expect(calls[0].init.headers).toBeUndefined();
  });

  /** `security.md` §8: a sessao e' cookie `HttpOnly`, nao header. */
  test('a sessao viaja no cookie', async () => {
    const calls = recordCalls([jsonResponse({ data: { id: 'f-1' } })]);

    await requestUpload(PATH, { form: buildForm() });

    expect(calls[0].init.credentials).toBe('include');
  });
});

describe('a sessao expirada nao custa o arquivo escolhido', () => {
  /**
   * O pai que escolhe a foto depois de vinte minutos parado tem a sessao
   * expirada. Sem a renovacao aqui, o 401 subiria como falha e ele teria de
   * achar a foto outra vez — reenviar e' seguro porque o corpo e' um
   * `FormData`, nao um fluxo ja consumido.
   */
  test('401 renova e reenvia o mesmo FormData', async () => {
    const calls = recordCalls([
      jsonResponse({ error: { code: 'SESSION_EXPIRED', message: 'expirou' } }, 401),
      jsonResponse({ data: {} }, 200),
      jsonResponse({ data: { id: 'f-1' } }),
    ]);
    const form = buildForm();

    const view = await requestUpload(PATH, { form });

    expect(calls.map((call) => call.init.method)).toEqual(['POST', 'PUT', 'POST']);
    expect(calls[1].url).toContain('/v1/auth/sessions');
    expect(calls[2].init.body).toBe(form);
    expect(view.id).toBe('f-1');
  });
});

describe('a recusa da API chega nomeada', () => {
  test('o codigo do erro sobrevive ao envio', async () => {
    recordCalls([
      jsonResponse({ error: { code: 'CHILD_FILE_CONTENT_TYPE_NOT_ALLOWED', message: 'tipo nao aceito' } }, 422),
    ]);

    const failure = await requestUpload(PATH, { form: buildForm() }).catch((error) => error);

    expect(failure).toBeInstanceOf(ApiError);
    expect(failure.code).toBe('CHILD_FILE_CONTENT_TYPE_NOT_ALLOWED');
  });
});

describe('a vista volta na lingua das telas', () => {
  /**
   * As telas leem snake_case (heranca do Base44). Sem passar pelo tradutor de
   * chaves, a linha do arquivo mostraria `undefined` no tamanho — a API fala
   * `byteSize` e a tela le `byte_size`.
   */
  test('byteSize chega como byte_size', async () => {
    recordCalls([jsonResponse({ data: { id: 'f-1', byteSize: 2048, takenOn: '2026-09-07' } })]);

    const view = await requestUpload(PATH, { form: buildForm() });

    expect(view.byte_size).toBe(2048);
    expect(view.taken_on).toBe('2026-09-07');
  });
});
