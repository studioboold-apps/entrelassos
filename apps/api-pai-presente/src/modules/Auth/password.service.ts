/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { PasswordHasher, VerifyPasswordParams } from './types/auth.types';

/**
 * Argon2id e a escolha do OWASP para senha nova: ele custa MEMORIA, e memoria e
 * o que a placa de video do atacante nao tem de sobra. Os parametros ficam no
 * proprio hash, entao subir o custo depois nao invalida o que ja esta gravado.
 */
const HASH_ALGORITHM = 'argon2id';

/**
 * Senha qualquer, so para haver o que conferir quando o e-mail nao existe.
 * Ela nunca abre nada: o `verify` contra ela e feito para GASTAR O MESMO TEMPO
 * do caminho legitimo, e o resultado e descartado.
 */
const DUMMY_PASSWORD = 'conta-que-nao-existe-neste-banco';

export function createPasswordHasher(): PasswordHasher {
  /**
   * O hash de mentira e caro e nao muda: calcular um por tentativa recusada
   * daria ao atacante uma forma de gastar CPU alheia de graca. Fica memoizado
   * em promessa porque `Bun.password.hash` e assincrono e o modulo nao pode
   * esperar por ele para ser importado.
   */
  let dummyHash: Promise<string> | undefined;
  function readDummyHash(): Promise<string> {
    dummyHash ??= Bun.password.hash(DUMMY_PASSWORD, { algorithm: HASH_ALGORITHM });
    return dummyHash;
  }

  return {
    async hash(password: string): Promise<string> {
      return await Bun.password.hash(password, { algorithm: HASH_ALGORITHM });
    },

    /**
     * E-mail desconhecido tambem paga o preco do `verify`. Sem isso, a resposta
     * volta rapido demais para quem nao tem conta e devagar para quem tem — e o
     * relogio passa a responder "essa pessoa e cliente daqui", que e exatamente
     * o que a mensagem de erro se esforca para nao dizer.
     */
    async verify({ password, passwordHash }: VerifyPasswordParams): Promise<boolean> {
      if (passwordHash === undefined) {
        await Bun.password.verify(password, await readDummyHash());
        return false;
      }
      return await Bun.password.verify(password, passwordHash);
    },
  };
}
