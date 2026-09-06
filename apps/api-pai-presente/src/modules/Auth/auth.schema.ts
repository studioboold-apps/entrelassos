/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { z } from 'zod';

import { MEDIUM_TEXT_LENGTH } from '../shared/shared.constant';
import { shortTextSchema } from '../shared/shared.schema';
import {
  PASSWORD_AUTH_PROVIDER,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  TOKEN_AUTH_PROVIDERS,
} from './auth.constant';

/**
 * Normalizar ANTES de validar, nao depois: `z.email()` recusaria " Ana@x.com "
 * pelo espaco, e quem digita no celular manda espaco o tempo todo. O minusculo
 * e o que faz `Ana@x.com` e `ana@x.com` serem a MESMA conta — sem ele, o unico
 * indice do banco deixa a segunda passar e a pessoa fica com duas.
 */
export const accountEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email().max(MEDIUM_TEXT_LENGTH));

/**
 * Sem `trim`: espaco e caractere de senha como qualquer outro, e cortar aqui
 * gravaria no cadastro uma senha diferente da que a pessoa digita para entrar.
 */
export const accountPasswordSchema = z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH);

/**
 * O `idToken` chega no CORPO porque e o unico jeito de ele nao aparecer em log
 * de servidor nem em historico de navegador — query string vaza nos dois. A
 * senha viaja pelo mesmo motivo.
 */
const tokenSignInSchema = z.object({
  provider: z.enum(TOKEN_AUTH_PROVIDERS),
  idToken: z.string().min(1).max(4096),
});

const passwordSignInSchema = z.object({
  provider: z.literal(PASSWORD_AUTH_PROVIDER),
  email: accountEmailSchema,
  password: accountPasswordSchema,
});

/**
 * Uniao discriminada, e nao um objeto com tudo opcional: assim `password` sem
 * senha e recusado na fronteira, em vez de chegar ao caso de uso como
 * `undefined` e virar decisao la dentro.
 */
export const signInSchema = z.discriminatedUnion('provider', [tokenSignInSchema, passwordSignInSchema]);
export type SignInBody = z.infer<typeof signInSchema>;

export const registerWithPasswordSchema = z
  .object({
    email: accountEmailSchema,
    password: accountPasswordSchema,
    fullName: shortTextSchema.optional(),
  })
  .strict();
export type RegisterWithPasswordBody = z.infer<typeof registerWithPasswordSchema>;
