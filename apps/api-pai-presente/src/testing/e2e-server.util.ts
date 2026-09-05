/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { HEALTH_PATH } from '../modules/shared/http/http.constant';
import type { SendParams, TestClient, TestResponse } from './http-test.util';

const ENVIRONMENT_FILE = join(import.meta.dir, '../../../../envs/env.test.e2e');
const API_ENTRY_POINT = join(import.meta.dir, '../main.ts');

const HEALTH_TIMEOUT_MS = 20_000;
const HEALTH_POLL_INTERVAL_MS = 200;

/** O arquivo de env usa `${VAR}` porque quem o le de verdade e o `make`. */
const REFERENCE_PATTERN = /\$\{([A-Z0-9_]+)\}/g;

export function readEndToEndEnvironment(): Record<string, string> {
  const content = readFileSync(ENVIRONMENT_FILE, 'utf8');
  const values: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator < 0) continue;
    const key = trimmed.slice(0, separator);
    values[key] = trimmed
      .slice(separator + 1)
      .replace(REFERENCE_PATTERN, (_reference, name: string) => values[name] ?? '');
  }
  return values;
}

function readCookieJar(jar: Map<string, string>, response: Response): void {
  for (const header of response.headers.getSetCookie()) {
    const [pair = ''] = header.split(';');
    const separator = pair.indexOf('=');
    if (separator < 0) continue;
    const name = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1);
    // Sair apaga o cookie mandando valor vazio: guardar isso mandaria de volta
    // um `pp_access=` que o servidor le como sessao presente e invalida.
    if (value.length === 0) jar.delete(name);
    else jar.set(name, value);
  }
}

/**
 * Mesmo contrato do cliente em memoria dos testes de rota, so que por rede e com
 * pote de cookies — e por isso o E2E le igual a eles, e os mesmos `readData*`
 * servem aos dois. O cookie e o que prova ENTRAR: sem ele a chamada e anonima.
 */
function createCookieClient(baseUrl: string): TestClient {
  const jar = new Map<string, string>();
  return {
    async send({ method, path, body, headers }: SendParams): Promise<TestResponse> {
      const requestHeaders = new Headers(headers);
      if (body !== undefined) requestHeaders.set('content-type', 'application/json');
      if (jar.size > 0) {
        requestHeaders.set(
          'cookie',
          [...jar].map(([name, value]) => `${name}=${value}`).join('; '),
        );
      }
      const init: RequestInit =
        body === undefined
          ? { method, headers: requestHeaders }
          : { method, headers: requestHeaders, body: JSON.stringify(body) };
      const response = await fetch(`${baseUrl}${path}`, init);
      readCookieJar(jar, response);
      const text = await response.text();
      return {
        status: response.status,
        payload: text.length > 0 ? JSON.parse(text) : undefined,
        headers: response.headers,
      };
    },
  };
}

async function isHealthy(healthUrl: string): Promise<boolean> {
  try {
    const response = await fetch(healthUrl);
    return response.ok;
  } catch {
    // Recusa de conexao e o normal enquanto o processo ainda esta subindo.
    return false;
  }
}

export type EndToEndApi = {
  readonly baseUrl: string;
  readonly client: TestClient;
  readonly stop: () => Promise<void>;
};

/**
 * Sobe a API DE VERDADE (`main.ts`), com o env de `env.test.e2e`: e o unico jeito
 * de o teste passar por boot, CORS, cookie e roteador reais. Importar uma fabrica
 * pularia justamente a parte que so quebra em producao.
 */
export async function startEndToEndApi(): Promise<EndToEndApi> {
  const environment = readEndToEndEnvironment();
  const baseUrl = environment.API_BASE_URL ?? '';
  const api = Bun.spawn({
    cmd: ['bun', API_ENTRY_POINT],
    env: { ...Bun.env, ...environment },
    stdout: 'ignore',
    stderr: 'pipe',
  });

  const deadline = Date.now() + HEALTH_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (api.exitCode !== null) {
      const reason = await new Response(api.stderr).text();
      throw new Error(`a API morreu antes de responder (${baseUrl}):\n${reason}`);
    }
    if (await isHealthy(`${baseUrl}${HEALTH_PATH}`)) {
      return {
        baseUrl,
        client: createCookieClient(baseUrl),
        stop: async () => {
          api.kill();
          await api.exited;
        },
      };
    }
    await Bun.sleep(HEALTH_POLL_INTERVAL_MS);
  }

  api.kill();
  throw new Error(`a API nao respondeu ${HEALTH_PATH} em ${baseUrl} apos ${HEALTH_TIMEOUT_MS}ms`);
}
