/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

const FORWARDED_PROTO_HEADER = 'x-forwarded-proto';
const FORWARDED_HOST_HEADER = 'x-forwarded-host';
const HOST_HEADER = 'host';
const HTTP_PERMANENT_REDIRECT = 308;

/**
 * O provedor termina o TLS e diz por qual esquema o navegador chegou. Se disse
 * `http`, a resposta e' um desvio para `https` — e' cinto sobre suspensorio:
 * Fly e Railway ja forcam HTTPS na borda, mas essa e' configuracao do painel,
 * que ninguem revisa em code review e some numa recriacao do serviço.
 *
 * `308`, nunca `301`: o 301 faz cliente antigo trocar POST por GET, e um POST
 * de login virando GET perde o corpo em silencio.
 *
 * Sem o cabecalho nao ha desvio nenhum: ai nao existe proxy na frente — e' a
 * imagem rodando direto, em maquina de quem desenvolve. Desviar ali quebraria
 * a fumaca local sem proteger ninguem.
 */
export function buildHttpsRedirect(request) {
  const proto = request.headers.get(FORWARDED_PROTO_HEADER);
  if (proto === null || proto === 'https') return undefined;

  const host = request.headers.get(FORWARDED_HOST_HEADER) ?? request.headers.get(HOST_HEADER);
  if (host === null) return undefined;

  const { pathname, search } = new URL(request.url);

  return Response.redirect(`https://${host}${pathname}${search}`, HTTP_PERMANENT_REDIRECT);
}
