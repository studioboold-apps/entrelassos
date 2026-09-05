/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { toConversationId, toScreenMessages } from '@/lib/chat-history';
import { describeApiFailure } from '@/lib/api-error-message';

const CHAT_HISTORY_QUERY_KEY = 'chat-messages';

/** As perguntas prontas sao CHAVES; o texto delas mora no `*.locale.json`. */
export const SUGGESTED_QUESTION_KEYS = Object.freeze([
  'chat.suggestions.positiveReinforcement',
  'chat.suggestions.tantrums',
  'chat.suggestions.money',
  'chat.suggestions.weekend',
]);

export const MESSAGE_ROLES = Object.freeze({ USER: 'user', ASSISTANT: 'assistant' });

/**
 * `web.md` §4: a tela nao guarda estado nem chama API. Tudo o que decide vive
 * aqui, e `Chat.jsx` so' recebe e desenha.
 */
export function useChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const conversationId = toConversationId(user.id);
  const [question, setQuestion] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const historyQuery = useQuery({
    queryKey: [CHAT_HISTORY_QUERY_KEY, conversationId],
    queryFn: async () =>
      toScreenMessages(await api.entities.ChatMessage.listByConversation(conversationId)),
  });

  const history = historyQuery.data ?? [];

  const sendMutation = useMutation({
    /**
     * A pergunta e' gravada ANTES da chamada paga. Sem chave de IA a resposta e'
     * 503, e gravar so' no fim faria a pergunta do pai sumir junto com a falha:
     * ele veria a propria frase desaparecer da tela sem explicacao.
     *
     * Quem sao os filhos e qual a orientacao do pai nao viajam daqui: a API ja
     * conhece o pai autenticado e monta o contexto do lado dela (`security.md`
     * §1). A tela manda a pergunta, so.
     *
     * `POST /v1/chat` responde e NAO grava: as duas pontas da conversa sao
     * escritas aqui, na ordem em que foram ditas.
     *
     * @param {string} text
     */
    mutationFn: async (text) => {
      await api.entities.ChatMessage.create({
        conversationId,
        role: MESSAGE_ROLES.USER,
        content: text,
      });

      const reply = await api.ai.chat(text);

      await api.entities.ChatMessage.create({
        conversationId,
        role: MESSAGE_ROLES.ASSISTANT,
        content: reply,
      });
    },
    /**
     * `onSettled` e nao `onSuccess`: mesmo quando a IA recusa, a pergunta ja
     * esta gravada, e e' o historico do servidor que a traz de volta a tela.
     */
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [CHAT_HISTORY_QUERY_KEY, conversationId] });
      inputRef.current?.focus();
    },
  });

  /**
   * Enquanto a chamada corre, a pergunta ainda nao voltou do servidor. Ela sai
   * da propria mutation, e nao de uma lista paralela em `useState` (`web.md` §5):
   * duas listas da mesma conversa divergem na primeira recarga.
   */
  const pendingMessages = sendMutation.isPending
    ? [{ role: MESSAGE_ROLES.USER, content: sendMutation.variables }]
    : [];

  const messages = [...history, ...pendingMessages];

  /**
   * A recusa e' AVISO, nao fala do mentor. Enquanto ela virava uma mensagem de
   * assistente com texto fixo, o motivo escrito pela API se perdia — e o app
   * punha palavra na boca de quem nunca respondeu.
   */
  const sendFailure = sendMutation.isError ? describeApiFailure(sendMutation.error) : null;

  /**
   * `messages` e' derivado, entao e' um array novo a cada render: depender dele
   * mandaria a tela rolar sem parar. Quem manda rolar e' a conversa ter crescido.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  /** @param {string} text */
  function sendQuestion(text) {
    if (!text.trim() || sendMutation.isPending) return;

    setQuestion('');
    sendMutation.mutate(text);
  }

  function handleQuestionChange(event) {
    setQuestion(event.target.value);
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendQuestion(question);
  }

  return {
    question,
    messages,
    sendFailure,
    isSending: sendMutation.isPending,
    canSend: question.trim().length > 0 && !sendMutation.isPending,
    messagesEndRef,
    inputRef,
    handleQuestionChange,
    handleSubmit,
    sendQuestion,
  };
}
