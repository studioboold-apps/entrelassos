/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { z } from 'zod';

import { AUTH_PROVIDERS } from './auth.constant';

/**
 * O `idToken` chega no CORPO porque e o unico jeito de ele nao aparecer em log
 * de servidor nem em historico de navegador — query string vaza nos dois.
 */
export const signInSchema = z.object({
  provider: z.enum(AUTH_PROVIDERS),
  idToken: z.string().min(1).max(4096),
});
export type SignInBody = z.infer<typeof signInSchema>;
