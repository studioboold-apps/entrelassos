/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { DomainError } from '../shared/errors/app.error';
import { ResourceNotFoundError } from '../shared/errors/shared.error';
import { ERROR_CODES } from '../shared/errors/codes';
import { HTTP_STATUS } from '../shared/http/http.constant';

/** 502 e nao 500: quem falhou foi o terceiro, e o cliente pode tentar de novo. */
export class LlmProviderFailedError extends DomainError {
  constructor() {
    super({
      code: ERROR_CODES.ai.PROVIDER_FAILED,
      message: 'O provedor de IA nao respondeu.',
      statusCode: 502,
    });
  }
}

/** Saida fora do formato pedido e falha do provedor, nao do usuario. */
export class LlmResponseInvalidError extends DomainError {
  constructor() {
    super({
      code: ERROR_CODES.ai.RESPONSE_INVALID,
      message: 'A resposta do provedor de IA veio fora do formato.',
      statusCode: 502,
    });
  }
}

/** Sem filho cadastrado nao ha o que personalizar — e nao se gasta a chamada. */
export class NoChildrenRegisteredError extends DomainError {
  constructor() {
    super({
      code: ERROR_CODES.ai.NO_CHILDREN,
      message: 'Cadastre ao menos um filho antes de pedir sugestoes.',
      statusCode: 422,
    });
  }
}

/**
 * 503 e nao 500: falta um RECURSO (a chave do provedor), e o mesmo trato do
 * login sem provedor configurado. Derrubar o boot por causa disso levaria filho,
 * atividade e boletim junto — coisas que nao geram texto nenhum.
 *
 * A frase nao nomeia um recurso: a mesma classe atende insight, sugestao,
 * boletim e chat, e quem pergunta no chat nao pediu sugestao nenhuma.
 */
export class LlmNotConfiguredError extends DomainError {
  constructor(provider: string) {
    super({
      code: ERROR_CODES.ai.NOT_CONFIGURED,
      message: `Recursos de IA indisponiveis: o provedor ${provider} esta sem chave.`,
      statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
    });
  }
}

/**
 * Transcrever audio e' outro recurso, com outra chave (a Anthropic nao ouve
 * audio). Faltar a chave dele nao pode derrubar o chat de texto: so' o botao de
 * gravar responde 503.
 */
export class TranscriptionNotConfiguredError extends DomainError {
  constructor() {
    super({
      code: ERROR_CODES.ai.TRANSCRIPTION_NOT_CONFIGURED,
      message: 'Audio indisponivel por enquanto: a transcricao esta sem chave. Escreva a pergunta.',
      statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
    });
  }
}

export class AudioTooLargeError extends DomainError {
  constructor(maxMegabytes: number) {
    super({
      code: ERROR_CODES.ai.AUDIO_TOO_LARGE,
      message: `Audio longo demais. O limite e' de ${maxMegabytes} MB; grave em partes menores.`,
      statusCode: 413,
    });
  }
}

/** Nem o tipo do arquivo nem o `Content-Type` decidem: os bytes decidem. */
export class AudioInvalidError extends DomainError {
  constructor() {
    super({
      code: ERROR_CODES.ai.AUDIO_INVALID,
      message: 'Nao entendemos esse audio. Grave de novo pelo botao do microfone, falando perto do celular.',
      statusCode: 400,
    });
  }
}

/** 404 e nao 403: filho de outro pai nao existe para quem pergunta. */
export class SuggestionChildNotFoundError extends ResourceNotFoundError {
  constructor() {
    super(ERROR_CODES.child.CHILD_NOT_FOUND, 'Filho nao encontrado.');
  }
}
