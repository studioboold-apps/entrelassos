/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { API_VERSION_PREFIX } from '../shared/http/http.constant';

export const OIDC_AUTH_PROVIDERS = ['google', 'apple'] as const;
export type OidcAuthProvider = (typeof OIDC_AUTH_PROVIDERS)[number];

/**
 * Provedor de desenvolvimento. Existe no tipo para a rota de login aceita-lo sem
 * um schema paralelo; quem decide se ele EXISTE de fato e o registro, que morre
 * no boot se alguem o ligar em producao.
 */
export const DEVELOPMENT_AUTH_PROVIDER = 'dev';

/**
 * Entrada por e-mail e senha. Ela NAO e um verificador: verificador transforma
 * prova externa em identidade e nunca le o nosso banco, enquanto a senha le o
 * nosso armazem e ainda tem uma metade de cadastro. Mora aqui so o nome do
 * provedor, que e o que o corpo do login carrega.
 */
export const PASSWORD_AUTH_PROVIDER = 'password';

export const TOKEN_AUTH_PROVIDERS = [...OIDC_AUTH_PROVIDERS, DEVELOPMENT_AUTH_PROVIDER] as const;
export type TokenAuthProvider = (typeof TOKEN_AUTH_PROVIDERS)[number];

export const AUTH_PROVIDERS = [...TOKEN_AUTH_PROVIDERS, PASSWORD_AUTH_PROVIDER] as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

export const AUTH_BASE_PATH = `${API_VERSION_PREFIX}/auth`;
export const SESSIONS_PATH = `${AUTH_BASE_PATH}/sessions`;
/** Cadastro e recurso proprio: `POST /sessions` abre sessao, nao cria conta. */
export const REGISTRATIONS_PATH = `${AUTH_BASE_PATH}/registrations`;

export const ACCESS_COOKIE_NAME = 'pp_access';
export const REFRESH_COOKIE_NAME = 'pp_refresh';

/** O cookie de acesso vai em toda chamada; o de refresh so na rota que o usa. */
export const ACCESS_COOKIE_PATH = '/';
export const REFRESH_COOKIE_PATH = AUTH_BASE_PATH;

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

export const ACCESS_TOKEN_ISSUER = 'pai-presente-api';
export const ACCESS_TOKEN_AUDIENCE = 'pai-presente-app';
export const ACCESS_TOKEN_ALGORITHM = 'HS256';

export const REFRESH_TOKEN_BYTES = 32;
/** SHA-256 em hexadecimal — o refresh so existe em claro no cookie do dono. */
export const REFRESH_TOKEN_HASH_LENGTH = 64;

export const PROVIDER_SUBJECT_LENGTH = 255;

/**
 * Doze caracteres e o piso do ASVS 2.1.1, que e a regua declarada em
 * `security.md` §0 para produto com dado pessoal. O teto existe para o hash nao
 * virar porta de negacao de servico, e 128 e folgado o bastante para frase.
 */
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;
/** Argon2id em codificacao PHC cabe folgado; o campo e do tamanho do texto medio. */
export const PASSWORD_HASH_LENGTH = 255;

/**
 * Limite por CONTA, nao por IP (security.md §3): quem tenta adivinhar a senha
 * de alguem escolhe o alvo, e limitar o IP so faria o predio inteiro pagar pelo
 * vizinho. Mais duro que o da IA porque aqui a tentativa e o ataque.
 */
export const PASSWORD_SIGN_IN_RATE_LIMIT = { maxRequests: 10, windowSeconds: 15 * 60 } as const;

export const OIDC_PROVIDER_CONFIG = {
  google: {
    issuers: ['https://accounts.google.com', 'accounts.google.com'],
    jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs',
  },
  apple: {
    issuers: ['https://appleid.apple.com'],
    jwksUrl: 'https://appleid.apple.com/auth/keys',
  },
} as const;
