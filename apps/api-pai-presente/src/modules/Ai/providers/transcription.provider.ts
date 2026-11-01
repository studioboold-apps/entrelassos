/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import {
  collapseRepetitions,
  createGroqTranscriber,
  isTranscriptionError,
  TranscriptionRateLimitError,
  TranscriptionUnsupportedError,
} from '@adatechnology/audio-transcription-provider';

import { createLogger } from '../../shared/logger/logger';
import { TRANSCRIPTION_TIMEOUT_MS } from '../ai.constant';
import { AudioInvalidError, LlmProviderFailedError, TranscriptionNotConfiguredError } from '../ai.error';
import type { SpeechTranscriber, TranscriptionRequest } from '../types/ai.types';

const logger = createLogger({ traceId: 'ai-transcription', source: 'ai-transcription' });

export type CreateTranscriberParams = {
  readonly apiKey: string;
  /** Vazio usa o padrao do pacote (`whisper-large-v3-turbo`). */
  readonly model: string;
};

/**
 * Quem transcreve e' o pacote da casa (`@adatechnology/audio-transcription-provider`,
 * Whisper no Groq), o mesmo dos outros produtos. Este arquivo so' traduz: a
 * entrada do modulo para a do pacote, e os erros do pacote para os desta API.
 *
 * Sem chave, ninguem chama a rede: o chat escrito continua de pe e so' o
 * microfone responde 503.
 */
export function createTranscriber({ apiKey, model }: CreateTranscriberParams): SpeechTranscriber {
  if (apiKey.length === 0) {
    return {
      async transcribe(): Promise<never> {
        throw new TranscriptionNotConfiguredError();
      },
    };
  }

  const groq = createGroqTranscriber({
    apiKey,
    ...(model.length > 0 ? { model } : {}),
    // O pai esta' olhando a tela esperando o texto: o padrao do pacote (120 s) e' de fila.
    timeoutMs: TRANSCRIPTION_TIMEOUT_MS,
  });

  return {
    /** O audio vai, o texto volta, e nada fica: nem aqui, nem em log (`security.md` §1). */
    async transcribe({ audio, format }: TranscriptionRequest): Promise<string> {
      const result = await groq
        .transcribe({ buffer: Buffer.from(audio), mimeType: format.contentType })
        .catch((cause: unknown) => {
          if (cause instanceof TranscriptionUnsupportedError) throw new AudioInvalidError();
          logger.error('transcricao falhou', {
            reason: isTranscriptionError(cause) ? cause.message : 'desconhecido',
            isRateLimited: cause instanceof TranscriptionRateLimitError,
          });
          throw new LlmProviderFailedError();
        });

      // Silencio volta como texto vazio: para o pai, e' "nao ouvimos nada", nao erro do servidor.
      const text = collapseRepetitions(result.text).trim();
      if (text.length === 0) throw new AudioInvalidError();
      return text;
    },
  };
}
