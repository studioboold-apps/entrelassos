/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { z } from 'zod';

import { LLM_MAX_OUTPUT_TOKENS, OPENAI_BASE_URL } from '../ai.constant';
import { LlmResponseInvalidError } from '../ai.error';
import type { LlmProvider, LlmStructuredRequest, LlmTextRequest } from '../types/ai.types';
import { parseProviderPayload, postJson } from './provider.util';

const completionSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string().nullable() }) })),
});

export type OpenAiProviderParams = {
  readonly apiKey: string;
  readonly model: string;
};

export function createOpenAiProvider({ apiKey, model }: OpenAiProviderParams): LlmProvider {
  function buildRequest({ systemPrompt, userPrompt }: LlmTextRequest): Record<string, unknown> {
    return {
      model,
      max_completion_tokens: LLM_MAX_OUTPUT_TOKENS,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    };
  }

  async function sendForText(body: Record<string, unknown>): Promise<string> {
    const payload = await postJson({
      url: OPENAI_BASE_URL,
      headers: { authorization: `Bearer ${apiKey}` },
      body,
    });
    const completion = parseProviderPayload(completionSchema, payload);
    const content = completion.choices[0]?.message.content ?? '';
    if (content.length === 0) throw new LlmResponseInvalidError();
    return content;
  }

  return {
    name: 'openai',

    generateText: (request: LlmTextRequest) => sendForText(buildRequest(request)),

    async generateStructured(request: LlmStructuredRequest): Promise<unknown> {
      const content = await sendForText({
        ...buildRequest(request),
        response_format: {
          type: 'json_schema',
          json_schema: { name: request.schemaName, strict: true, schema: request.jsonSchema },
        },
      });
      // `strict` obriga o formato, mas a resposta ainda chega como TEXTO: JSON
      // quebrado aqui e falha do provedor, nao do pai que perguntou.
      try {
        return JSON.parse(content);
      } catch {
        throw new LlmResponseInvalidError();
      }
    },
  };
}
