/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { z } from 'zod';

import {
  ANTHROPIC_API_VERSION,
  ANTHROPIC_BASE_URL,
  LLM_MAX_OUTPUT_TOKENS,
} from '../ai.constant';
import { LlmResponseInvalidError } from '../ai.error';
import type { LlmProvider, LlmStructuredRequest, LlmTextRequest } from '../types/ai.types';
import { parseProviderPayload, postJson } from './provider.util';

const textBlockSchema = z.object({ type: z.literal('text'), text: z.string() });
const toolUseBlockSchema = z.object({ type: z.literal('tool_use'), input: z.unknown() });
const otherBlockSchema = z.object({ type: z.string() });

const messageSchema = z.object({
  content: z.array(z.union([textBlockSchema, toolUseBlockSchema, otherBlockSchema])),
});

export type AnthropicProviderParams = {
  readonly apiKey: string;
  readonly model: string;
};

export function createAnthropicProvider({ apiKey, model }: AnthropicProviderParams): LlmProvider {
  function buildRequest({ systemPrompt, userPrompt }: LlmTextRequest): Record<string, unknown> {
    return {
      model,
      max_tokens: LLM_MAX_OUTPUT_TOKENS,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    };
  }

  async function send(body: Record<string, unknown>): Promise<z.infer<typeof messageSchema>> {
    const payload = await postJson({
      url: ANTHROPIC_BASE_URL,
      headers: { 'x-api-key': apiKey, 'anthropic-version': ANTHROPIC_API_VERSION },
      body,
    });
    return parseProviderPayload(messageSchema, payload);
  }

  return {
    name: 'anthropic',

    async generateText(request: LlmTextRequest): Promise<string> {
      const message = await send(buildRequest(request));
      const text = message.content
        .filter((block): block is z.infer<typeof textBlockSchema> => block.type === 'text')
        .map((block) => block.text)
        .join('');
      if (text.length === 0) throw new LlmResponseInvalidError();
      return text;
    },

    /**
     * Formato estruturado por FERRAMENTA FORCADA: e o caminho que a Anthropic
     * garante hoje, e ele recusa a resposta em prosa em vez de deixar o parse
     * adivinhar onde o JSON comeca.
     */
    async generateStructured(request: LlmStructuredRequest): Promise<unknown> {
      const message = await send({
        ...buildRequest(request),
        tools: [
          {
            name: request.schemaName,
            description: 'Formato obrigatorio da resposta.',
            input_schema: request.jsonSchema,
          },
        ],
        tool_choice: { type: 'tool', name: request.schemaName },
      });

      const used = message.content.find((block) => block.type === 'tool_use');
      if (used === undefined || !('input' in used)) throw new LlmResponseInvalidError();
      return used.input;
    },
  };
}
