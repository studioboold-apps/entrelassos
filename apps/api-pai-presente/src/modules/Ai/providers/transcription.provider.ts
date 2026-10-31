/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { z } from 'zod';

import { createLogger } from '../../shared/logger/logger';
import {
  DEFAULT_TRANSCRIPTION_MODEL,
  TRANSCRIPTION_BASE_URL,
  TRANSCRIPTION_TIMEOUT_MS,
} from '../ai.constant';
import { LlmProviderFailedError, LlmResponseInvalidError, TranscriptionNotConfiguredError } from '../ai.error';
import type { SpeechTranscriber, TranscriptionRequest } from '../types/ai.types';
import { parseProviderPayload } from './provider.util';

const logger = createLogger({ traceId: 'ai-transcription', source: 'ai-transcription' });

const transcriptionSchema = z.object({ text: z.string() });

export type CreateTranscriberParams = {
  readonly apiKey: string;
  /** Vazio usa `DEFAULT_TRANSCRIPTION_MODEL`. */
  readonly model: string;
};

/**
 * Sem chave, ninguem chama a rede — o mesmo trato do provedor de texto: o chat
 * escrito continua de pe e so' o microfone responde 503.
 */
export function createTranscriber({ apiKey, model }: CreateTranscriberParams): SpeechTranscriber {
  if (apiKey.length === 0) {
    return {
      async transcribe(): Promise<never> {
        throw new TranscriptionNotConfiguredError();
      },
    };
  }

  const resolvedModel = model.length > 0 ? model : DEFAULT_TRANSCRIPTION_MODEL;

  return {
    /**
     * O audio vai, o texto volta, e nada fica: nem aqui, nem em log. O corpo
     * carrega a voz do pai falando dos filhos (`security.md` §1).
     */
    async transcribe({ audio, format }: TranscriptionRequest): Promise<string> {
      const form = new FormData();
      form.append('model', resolvedModel);
      form.append('response_format', 'json');
      form.append('file', new Blob([audio], { type: format.contentType }), `audio.${format.extension}`);

      const response = await fetch(TRANSCRIPTION_BASE_URL, {
        method: 'POST',
        headers: { authorization: `Bearer ${apiKey}` },
        body: form,
        signal: AbortSignal.timeout(TRANSCRIPTION_TIMEOUT_MS),
      }).catch((cause: unknown) => {
        logger.error('transcricao inacessivel', {
          reason: cause instanceof Error ? cause.name : 'desconhecido',
        });
        throw new LlmProviderFailedError();
      });

      if (!response.ok) {
        logger.error('transcricao recusou', { status: response.status });
        throw new LlmProviderFailedError();
      }

      const { text } = parseProviderPayload(transcriptionSchema, await response.json());
      const trimmed = text.trim();
      if (trimmed.length === 0) throw new LlmResponseInvalidError();
      return trimmed;
    },
  };
}
