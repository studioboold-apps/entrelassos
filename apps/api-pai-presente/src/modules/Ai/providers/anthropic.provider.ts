/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { z } from 'zod';

import {
  ANTHROPIC_API_VERSION,
  ANTHROPIC_BASE_URL,
  ANTHROPIC_FALLBACK_BETA,
  LLM_MAX_OUTPUT_TOKENS,
  LLM_TASK_PROFILES,
  type LlmTier,
} from '../ai.constant';
import { LlmResponseInvalidError } from '../ai.error';
import type { LlmProvider, LlmStructuredRequest, LlmTextRequest } from '../types/ai.types';
import { parseProviderPayload, postJson, toAlternatingTurns } from './provider.util';

const textBlockSchema = z.object({ type: z.literal('text'), text: z.string() });
const toolUseBlockSchema = z.object({ type: z.literal('tool_use'), input: z.unknown() });
const otherBlockSchema = z.object({ type: z.string() });

const messageSchema = z.object({
  content: z.array(z.union([textBlockSchema, toolUseBlockSchema, otherBlockSchema])),
  stop_reason: z.string().nullish(),
});
type AnthropicMessage = z.infer<typeof messageSchema>;

/**
 * Familia 5.x: aceita `output_config` (esforco e formato JSON) e o cache
 * automatico com o prefixo minimo de 512 tokens. Modelo mais antigo, vindo do
 * env, segue pelo caminho de antes (ferramenta forcada, sem esforco).
 */
const MODERN_MODEL = /^claude-(opus|sonnet|haiku|fable|mythos)-5(\b|-)/;
/**
 * So' estes recusam `tool_choice` forcado e tem o classificador de seguranca
 * com reenvio automatico (`fallbacks: "default"`). O Haiku nao aceita o campo.
 */
const FALLBACK_MODEL = /^claude-(opus-5|sonnet-5-5)/;

/**
 * O formato JSON da Anthropic recusa restricoes numericas e de tamanho
 * (`maxLength`, `minimum`...). Elas saem daqui e continuam valendo: a resposta
 * volta pelo MESMO schema Zod, que as confere.
 */
const UNSUPPORTED_SCHEMA_KEYS = new Set([
  'maxLength',
  'minLength',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  'minItems',
  'maxItems',
]);

export function toAnthropicJsonSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(toAnthropicJsonSchema);
  if (schema === null || typeof schema !== 'object') return schema;
  const entries = Object.entries(schema as Record<string, unknown>)
    .filter(([key]) => !UNSUPPORTED_SCHEMA_KEYS.has(key))
    .map(([key, value]) => [key, toAnthropicJsonSchema(value)] as const);
  const result: Record<string, unknown> = Object.fromEntries(entries);
  if (result.type === 'object') result.additionalProperties = false;
  return result;
}

export type AnthropicProviderParams = {
  readonly apiKey: string;
  readonly models: Readonly<Record<LlmTier, string>>;
};

export function createAnthropicProvider({ apiKey, models }: AnthropicProviderParams): LlmProvider {
  function buildRequest({
    task,
    systemPrompt,
    userPrompt,
    history = [],
    images = [],
  }: LlmTextRequest): Record<string, unknown> {
    const profile = LLM_TASK_PROFILES[task];
    const model = models[profile.tier];
    const isModern = MODERN_MODEL.test(model);
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
      // Cache automatico no ultimo bloco: o system prompt e a conversa ja
      // enviada sao lidos do cache na fala seguinte (custo de leitura ~10%).
      // Abaixo do prefixo minimo do modelo, o provedor so' nao guarda.
      cache_control: { type: 'ephemeral' },
      ...(isModern ? { output_config: { effort: profile.effort } } : {}),
      ...(FALLBACK_MODEL.test(model) ? { fallbacks: 'default' } : {}),
    };
  }

  async function send(body: Record<string, unknown>): Promise<AnthropicMessage> {
    const usesFallback = 'fallbacks' in body;
    const payload = await postJson({
      url: ANTHROPIC_BASE_URL,
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_API_VERSION,
        ...(usesFallback ? { 'anthropic-beta': ANTHROPIC_FALLBACK_BETA } : {}),
      },
      body,
    });
    const message = parseProviderPayload(messageSchema, payload);
    // Recusa ou corte no teto: o texto que veio nao e' resposta inteira, e
    // mostrar meia resposta (ou meio JSON) ao pai e' pior que o erro legivel.
    if (message.stop_reason === 'refusal' || message.stop_reason === 'max_tokens') {
      throw new LlmResponseInvalidError();
    }
    return message;
  }

  function readText(message: AnthropicMessage): string {
    return message.content
      .filter((block): block is z.infer<typeof textBlockSchema> => block.type === 'text')
      .map((block) => block.text)
      .join('');
  }

  return {
    name: 'anthropic',

    async generateText(request: LlmTextRequest): Promise<string> {
      const text = readText(await send(buildRequest(request)));
      if (text.length === 0) throw new LlmResponseInvalidError();
      return text;
    },

    /**
     * Na familia 5.x, formato JSON nativo (`output_config.format`): o Sonnet
     * 5.5 recusa `tool_choice` forcado com 400. Modelos antigos seguem pela
     * FERRAMENTA FORCADA, que recusa prosa em vez de deixar o parse adivinhar.
     */
    async generateStructured(request: LlmStructuredRequest): Promise<unknown> {
      const base = buildRequest(request);
      if (MODERN_MODEL.test(String(base.model))) {
        const outputConfig = (base.output_config ?? {}) as Record<string, unknown>;
        const message = await send({
          ...base,
          output_config: {
            ...outputConfig,
            format: { type: 'json_schema', schema: toAnthropicJsonSchema(request.jsonSchema) },
          },
        });
        try {
          return JSON.parse(readText(message));
        } catch {
          throw new LlmResponseInvalidError();
        }
      }

      const message = await send({
        ...base,
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
