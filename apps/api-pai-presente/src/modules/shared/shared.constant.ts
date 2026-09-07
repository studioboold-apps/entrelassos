/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

export const ACTIVITY_CATEGORIES = [
  'aventura',
  'educativa',
  'esportiva',
  'criativa',
  'natureza',
  'culinaria',
  'jogos',
  'escolar',
  'cursos',
  'oficinas',
] as const;
export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export const CHILD_GENDERS = ['masculino', 'feminino', 'outro'] as const;
export type ChildGender = (typeof CHILD_GENDERS)[number];

export const MARITAL_STATUSES = [
  'solteiro',
  'casado',
  'divorciado',
  'viuvo',
  'uniao_estavel',
] as const;
export type MaritalStatus = (typeof MARITAL_STATUSES)[number];

export const COMMUNITY_POST_CATEGORIES = [
  'experiencia',
  'dica',
  'duvida',
  'conquista',
] as const;
export type CommunityPostCategory = (typeof COMMUNITY_POST_CATEGORIES)[number];

export const INSIGHT_CATEGORIES = [
  'comportamento',
  'sexualidade',
  'financeira',
  'saude',
] as const;
export type InsightCategory = (typeof INSIGHT_CATEGORIES)[number];

export const CHAT_ROLES = ['user', 'assistant'] as const;
export type ChatRole = (typeof CHAT_ROLES)[number];

/**
 * Foto e exame nao sao dois nomes para a mesma coisa: um e' lembranca, o outro
 * e' dado de saude sensivel (LGPD art. 5º II) e por isso viaja cifrado e com
 * trilha a cada leitura. O `kind` e' o que decide qual dos dois caminhos.
 */
export const CHILD_FILE_KINDS = ['foto', 'exame'] as const;
export type ChildFileKind = (typeof CHILD_FILE_KINDS)[number];

/** sha-256 em hexadecimal: 64 caracteres, sempre. */
export const CHECKSUM_LENGTH = 64;

/** `children/{uuid}/{uuid}` cabe em 80; o teto e' folga, nao estimativa. */
export const OBJECT_KEY_LENGTH = 200;

/** Teto de VARCHAR para valor de dominio fechado; ENUM nativo e proibido. */
export const DOMAIN_VALUE_LENGTH = 32;
export const SHORT_TEXT_LENGTH = 120;
export const MEDIUM_TEXT_LENGTH = 255;

/** Faixa da nota de 1 a 5, unica em todo o produto (atividade e insight). */
export const RATING_MIN = 1;
export const RATING_MAX = 5;

export const CHILD_AGE_MIN = 0;
export const CHILD_AGE_MAX = 25;
export const ADULT_AGE_MIN = 16;
export const ADULT_AGE_MAX = 120;

/** Teto de texto livre (post, comentario, mensagem de chat). */
export const FREE_TEXT_MAX_LENGTH = 4000;

/**
 * A trilha de auditoria admite NAO SABER o endereco. Guardar string vazia
 * deixaria a coluna parecendo preenchida — pior que a ausencia, porque parece
 * prova.
 */
export const UNKNOWN_CLIENT_IP = 'desconhecido';

/** IPv6 com zona cabe folgado; o corte existe contra cabecalho hostil. */
export const CLIENT_IP_LENGTH = 64;

/**
 * Teto por arquivo. 15 MiB cobre foto de celular (4 a 8 MiB em HEIC) e PDF de
 * exame com imagem dentro, e recusa o video que alguem tentaria mandar como
 * "foto" — este produto nao sabe servir video.
 *
 * O teto e' UM numero, checado duas vezes: o `Content-Length` antes de ler o
 * corpo (para nao guardar 2 GB na memoria so' para depois recusar) e o tamanho
 * REAL dos bytes, que e' o que decide. O cabecalho e' escrito pelo cliente.
 */
export const CHILD_FILE_MAX_BYTES = 15 * 1024 * 1024;

/**
 * Folga do envelope multipart na checagem previa: as linhas de fronteira e os
 * cabecalhos de parte fazem o `Content-Length` passar do tamanho do arquivo.
 * Sem esta folga, a checagem barata seria MAIS severa que a regra, e um arquivo
 * de 15 MiB exatos seria recusado por causa de duzentos bytes de moldura.
 */
export const CHILD_FILE_ENVELOPE_ALLOWANCE_BYTES = 8 * 1024;

/**
 * Teto por FILHO. 500 MiB e' de 60 a 120 fotos de celular mais os exames de um
 * ano — album de historia, e nao backup de galeria.
 *
 * O teto por arquivo sozinho nao limita nada: mil arquivos de 15 MiB passam um
 * por um e somam 15 GiB. Quem paga o balde e' a conta, e a conta descobriria
 * isso na fatura.
 */
export const CHILD_FILE_CHILD_QUOTA_BYTES = 500 * 1024 * 1024;

/**
 * Teto por CONTA, e de proposito NAO e' 500 MiB vezes o numero de filhos: um
 * pai de seis filhos multiplicaria a fatura por seis sem nunca encostar em teto
 * nenhum. O balde cobra por conta, entao o limite tambem e' por conta.
 *
 * 2 GiB deixa quatro filhos usarem o album inteiro deles, que e' a familia que
 * este produto atende — e ainda assim poe um numero na fatura.
 */
export const CHILD_FILE_ACCOUNT_QUOTA_BYTES = 2 * 1024 * 1024 * 1024;
