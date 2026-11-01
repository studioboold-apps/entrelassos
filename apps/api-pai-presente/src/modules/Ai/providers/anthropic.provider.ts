/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { z } from 'zod';

import {
  ANTHROPIC_API_VERSION,
  ANTHROPIC_BASE_URL,
  ANTHROPIC_WEB_SEARCH_TOOL,
  LLM_MAX_OUTPUT_TOKENS,
  WEB_SEARCH_MAX_USES,
  WEB_SEARCH_TIMEOUT_MS,
} from '../ai.constant';
import { LlmResponseInvalidError } from '../ai.error';
import type { LlmProvider, LlmStructuredRequest, LlmTextRequest, LlmWebSearchRequest } from '../types/ai.types';
import { parseProviderPayload, postJson, toAlternatingTurns } from './provider.util';

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
  function buildRequest({
    systemPrompt,
    userPrompt,
    history = [],
    images = [],
  }: LlmTextRequest): Record<string, unknown> {
    // Imagem antes do texto: e' a ordem em que o modelo melhor as relaciona.
    const content =
      images.length === 0
        ? userPrompt
        : [
            ...images.map(({ mediaType, data }) => ({
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data },
            })),
            { type: 'text', text: userPrompt },
          ];
    return {
      model,
      max_tokens: LLM_MAX_OUTPUT_TOKENS,
      system: systemPrompt,
      messages: [
        ...toAlternatingTurns(history).map(({ role, content: text }) => ({ role, content: text })),
        { role: 'user', content },
      ],
    };
  }

  async function send(
    body: Record<string, unknown>,
    timeoutMs?: number,
  ): Promise<z.infer<typeof messageSchema>> {
    const payload = await postJson({
      url: ANTHROPIC_BASE_URL,
      headers: { 'x-api-key': apiKey, 'anthropic-version': ANTHROPIC_API_VERSION },
      body,
      ...(timeoutMs === undefined ? {} : { timeoutMs }),
    });
    return parseProviderPayload(messageSchema, payload);
  }

  function joinText(message: z.infer<typeof messageSchema>): string {
    return message.content
      .filter((block): block is z.infer<typeof textBlockSchema> => block.type === 'text')
      .map((block) => block.text)
      .join('');
  }

  return {
    name: 'anthropic',

    async generateText(request: LlmTextRequest): Promise<string> {
      const text = joinText(await send(buildRequest(request)));
      if (text.length === 0) throw new LlmResponseInvalidError();
      return text;
    },

    /**
     * Pedido do design: sugestao com programa REAL da cidade. A busca e' a
     * ferramenta de servidor da Anthropic (quem busca e le as paginas e' ela);
     * aqui so' sai o texto final, com o que foi achado.
     */
    async searchWeb({ systemPrompt, userPrompt, city }: LlmWebSearchRequest): Promise<string> {
      const message = await send(
        {
          ...buildRequest({ systemPrompt, userPrompt }),
          tools: [
            {
              type: ANTHROPIC_WEB_SEARCH_TOOL,
              name: 'web_search',
              max_uses: WEB_SEARCH_MAX_USES,
              ...(city === undefined
                ? {}
                : {
                    user_location: {
                      type: 'approximate',
                      city,
                      country: 'BR',
                      timezone: 'America/Sao_Paulo',
                    },
                  }),
            },
          ],
        },
        WEB_SEARCH_TIMEOUT_MS,
      );
      return joinText(message);
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
