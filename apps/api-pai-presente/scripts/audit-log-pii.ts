/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/**
 * Varredura de PII no log (security.md §1). Este produto tem nome de crianca em
 * quase toda tabela, e a regra vale ate em `debug`.
 *
 * Ela roda contra a SAIDA de uma API de verdade respondendo pedido de verdade —
 * nunca contra o codigo-fonte. `logger.info('salvo', { child })` passa em
 * qualquer revisao e so se mostra quando executa; e o valor costuma nao vir de
 * quem escreveu a linha, mas de uma mensagem de erro do Postgres carregada de
 * dentro para fora.
 *
 * Por isso o roteiro tambem PROVOCA falha: e' no caminho recusado que o valor
 * viaja, e e' la que o filtro de excecao registra `cause`.
 */

import { PLANTED_CANARIES, findPiiInLog } from './log-pii.detector';

const AUDIT_PORT = 3412;
const BOOT_TIMEOUT_MS = 15_000;
const BOOT_POLL_MS = 200;
/** A linha que o `main.ts` escreve ao subir: e' a prova de que o cano funciona. */
const BOOT_LINE_MARKER = 'api no ar';

const IDENTITY_TOKEN = `${PLANTED_CANARIES.PARENT_EMAIL}|${PLANTED_CANARIES.PARENT_NAME}`;
const TODAY = new Date().toISOString().slice(0, 10);

type AuditContext = { postId?: string };

type Step = {
  readonly method: string;
  readonly path: string | ((context: AuditContext) => string);
  readonly body?: unknown;
  /** Guarda o `id` da resposta para o passo seguinte usar. */
  readonly capture?: keyof AuditContext;
};

/**
 * Metade aceita, metade recusada de proposito. So o caminho feliz mediria o
 * lado facil: quem loga PII costuma logar no `catch`. E as escritas sao
 * encadeadas — curtir duas vezes o mesmo post e' a tentativa deliberada de
 * arrancar um erro do banco, que e' o texto que carrega valor de dentro.
 */
const SCRIPT: readonly Step[] = [
  { method: 'POST', path: '/v1/auth/sessions', body: { provider: 'orkut', idToken: IDENTITY_TOKEN } },
  { method: 'POST', path: '/v1/auth/sessions', body: { provider: 'dev', idToken: PLANTED_CANARIES.PARENT_NAME } },
  { method: 'GET', path: '/v1/me' },
  { method: 'GET', path: '/v1/me/export' },
  { method: 'POST', path: '/v1/children', body: { name: PLANTED_CANARIES.CHILD_NAME, age: 9, gender: 'masculino', favoriteFood: `contato ${PLANTED_CANARIES.PHONE}` } },
  { method: 'POST', path: '/v1/children', body: { name: PLANTED_CANARIES.CHILD_NAME, age: 999, gender: 'masculino' } },
  { method: 'POST', path: '/v1/children', body: { name: PLANTED_CANARIES.CHILD_NAME, age: 9, gender: 'masculino', cpf: PLANTED_CANARIES.TAX_ID } },
  { method: 'GET', path: '/v1/children' },
  { method: 'GET', path: `/v1/children/${encodeURIComponent(PLANTED_CANARIES.CHILD_NAME)}` },
  { method: 'POST', path: '/v1/activities', body: { title: `Parque com ${PLANTED_CANARIES.CHILD_NAME}`, activityDate: TODAY, category: 'natureza', description: `avisar no ${PLANTED_CANARIES.PHONE}` } },
  { method: 'GET', path: '/v1/activities' },
  { method: 'POST', path: '/v1/community/posts', body: { content: `${PLANTED_CANARIES.CHILD_NAME} deu o primeiro passo.`, category: 'conquista' }, capture: 'postId' },
  { method: 'PUT', path: ({ postId }) => `/v1/community/posts/${postId}/like` },
  { method: 'PUT', path: ({ postId }) => `/v1/community/posts/${postId}/like` },
  { method: 'POST', path: '/v1/community/comments', body: undefined },
  { method: 'POST', path: '/v1/chat/messages', body: { conversationId: crypto.randomUUID(), role: 'user', content: `Meu filho ${PLANTED_CANARIES.CHILD_NAME} nao dorme` } },
  { method: 'POST', path: '/v1/insights' },
  { method: 'POST', path: '/v1/activity-suggestions' },
  { method: 'POST', path: '/v1/report', body: { month: '2026-09' } },
  { method: 'GET', path: `/v1/${encodeURIComponent(PLANTED_CANARIES.PARENT_EMAIL)}` },
];

async function waitForApi(baseUrl: string): Promise<void> {
  const deadline = Date.now() + BOOT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(`${baseUrl}/health`)).ok) return;
    } catch {
      // ainda subindo
    }
    await Bun.sleep(BOOT_POLL_MS);
  }
  throw new Error('a api nao subiu na porta da varredura');
}

async function signIn(baseUrl: string): Promise<string> {
  const response = await fetch(`${baseUrl}/v1/auth/sessions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ provider: 'dev', idToken: IDENTITY_TOKEN }),
  });
  if (!response.ok) throw new Error(`login de varredura recusado: ${response.status}`);
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';')[0])
    .join('; ');
}

function resolvePath(step: Step, context: AuditContext): string {
  return typeof step.path === 'function' ? step.path(context) : step.path;
}

async function runScript(baseUrl: string, cookie: string): Promise<void> {
  const context: AuditContext = {};

  for (const step of SCRIPT) {
    const path = resolvePath(step, context);
    const response = await fetch(`${baseUrl}${path}`, {
      method: step.method,
      headers: { cookie, 'content-type': 'application/json' },
      body: step.body === undefined ? undefined : JSON.stringify(step.body),
    });

    if (step.capture !== undefined && response.ok) {
      const payload = (await response.json()) as { data?: { id?: string } };
      context[step.capture] = payload.data?.id;
    }
    console.log(`  ${String(response.status).padEnd(3)} ${step.method.padEnd(4)} ${path}`);
  }
}

const baseUrl = `http://127.0.0.1:${AUDIT_PORT}`;
const api = Bun.spawn(['bun', 'src/main.ts'], {
  cwd: import.meta.dir.replace(/\/scripts$/, ''),
  env: { ...process.env, API_PORT: String(AUDIT_PORT) },
  stdout: 'pipe',
  stderr: 'pipe',
});

/**
 * O log e' lido do PROCESSO, nunca de um arquivo que alguem lembra de apontar:
 * arquivo esquecido produz varredura que passa por estar vazia.
 */
const captured = Promise.all([new Response(api.stdout).text(), new Response(api.stderr).text()]);

try {
  await waitForApi(baseUrl);
  await runScript(baseUrl, await signIn(baseUrl));
} finally {
  api.kill('SIGTERM');
  await api.exited;
}

const [output, errorOutput] = await captured;
const log = `${output}\n${errorOutput}`;
const lineCount = log.split('\n').filter((line) => line.length > 0).length;

console.log(`\nlinhas de log varridas -> ${lineCount}`);

/**
 * Varredura sobre nada passa sempre. Se nem a linha de boot chegou, o que
 * quebrou foi a captura — e o resultado nao vale como medicao.
 */
if (!log.includes(BOOT_LINE_MARKER)) {
  console.error('CAPTURA VAZIA: a linha de boot nao chegou, entao esta varredura nao mediu nada');
  process.exit(1);
}

const findings = findPiiInLog(log);
if (findings.length > 0) {
  console.error(`\nPII NO LOG (${findings.length}):`);
  for (const { reason, line } of findings) console.error(`  ${reason} -> ${line}`);
  process.exit(1);
}

console.log('varredura LIMPA        -> nenhuma isca e nenhum padrao de PII no log');
