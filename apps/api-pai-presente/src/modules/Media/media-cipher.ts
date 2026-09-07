/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { createEnvelopeCipher } from '../shared/crypto/envelope-cipher';

import { MEDIA_ENVELOPE_MAGIC, MEDIA_KEY_VARIABLE } from './media.constant';
import { MediaEnvelopeInvalidError, MediaKeyInvalidError } from './media.error';

/**
 * O exame e' dado de saude de uma crianca (LGPD art. 5º II, sensivel; art. 14).
 * `security.md` §5 exige cifra em repouso com chave de APLICACAO separada da
 * chave do banco — e aqui ela e' separada tambem da chave do backup, para que
 * vazar uma nao abra a outra.
 *
 * A cifragem acontece no use case, nunca dentro do adaptador de balde: se
 * estivesse la, trocar de destino perderia a cifra.
 *
 * A FOTO nao passa por aqui de proposito. Ela sai por link assinado curto, que
 * entrega o objeto sem passar pela API — e objeto cifrado nao abre no
 * navegador. O exame, por ser o dado sensivel, e' justamente o que a API serve
 * decifrando, porque e' o unico caminho que deixa trilha a cada leitura (§10).
 */
const cipher = createEnvelopeCipher({
  magic: MEDIA_ENVELOPE_MAGIC,
  keyVariable: MEDIA_KEY_VARIABLE,
  onKeyInvalid: (message) => new MediaKeyInvalidError(message),
  onEnvelopeInvalid: () =>
    new MediaEnvelopeInvalidError('os bytes guardados nao sao um envelope de midia do Pai Presente'),
});

export type EncryptMediaParams = {
  readonly plaintext: Uint8Array;
  readonly key: Uint8Array;
};

export type DecryptMediaParams = {
  readonly envelope: Uint8Array;
  readonly key: Uint8Array;
};

/** Chave vazia ou de tamanho errado RECUSA — chave curta que "funciona" e' o pior resultado. */
export function readMediaKey(encodedKey: string): Buffer {
  return cipher.readKey(encodedKey);
}

export function encryptMedia(params: EncryptMediaParams): Uint8Array {
  return cipher.encrypt(params);
}

export function decryptMedia(params: DecryptMediaParams): Uint8Array {
  return cipher.decrypt(params);
}
