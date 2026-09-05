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

export const AUTH_PROVIDERS = [...OIDC_AUTH_PROVIDERS, DEVELOPMENT_AUTH_PROVIDER] as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

export const AUTH_BASE_PATH = `${API_VERSION_PREFIX}/auth`;
export const SESSIONS_PATH = `${AUTH_BASE_PATH}/sessions`;

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
