/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { z } from 'zod';

import { LLM_MAX_OUTPUT_TOKENS, LLM_TASK_PROFILES, OPENAI_BASE_URL, type LlmTier } from '../ai.constant';
import { LlmResponseInvalidError } from '../ai.error';
import type { LlmProvider, LlmStructuredRequest, LlmTextRequest } from '../types/ai.types';
import { parseProviderPayload, postJson, toAlternatingTurns } from './provider.util';

const completionSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string().nullable() }) })),
});

export type OpenAiProviderParams = {
  readonly apiKey: string;
  readonly models: Readonly<Record<LlmTier, string>>;
};

/** O OpenAI faz cache de prefixo sozinho; aqui so' a escolha do modelo por tarefa. */
export function createOpenAiProvider({ apiKey, models }: OpenAiProviderParams): LlmProvider {
  function buildRequest({
    task,
    systemPrompt,
    userPrompt,
    history = [],
    images = [],
  }: LlmTextRequest): Record<string, unknown> {
    const content =
      images.length === 0
        ? userPrompt
        : [
            ...images.map(({ mediaType, data }) => ({
              type: 'image_url',
              image_url: { url: `data:${mediaType};base64,${data}` },
            })),
            { type: 'text', text: userPrompt },
          ];
    return {
      model: models[LLM_TASK_PROFILES[task].tier],
      max_completion_tokens: LLM_MAX_OUTPUT_TOKENS,
      messages: [
        { role: 'system', content: systemPrompt },
        ...toAlternatingTurns(history).map(({ role, content: text }) => ({ role, content: text })),
        { role: 'user', content },
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
