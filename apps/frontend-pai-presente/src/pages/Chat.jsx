import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { toConversationId, toScreenMessages } from '@/lib/chat-history';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Loader2, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { BRAND_LOGO } from '@/lib/brand';


const CHAT_HISTORY_QUERY_KEY = 'chat-messages';

const FAILURE_REPLY =
  'Desculpe, tive um problema ao processar sua mensagem. Por favor, tente novamente.';

const suggestedQuestions = [
  "Como aplicar reforço positivo?",
  "Lidar com birras de forma construtiva",
  "Falar sobre dinheiro com crianças",
  "Atividades em família no fim de semana"
];

export default function Chat() {
  const { user } = useAuth();
  const conversationId = toConversationId(user.id);
  /**
   * O que foi dito NESTA sessao fica aqui e o resto vem do banco. Copiar o
   * historico para dentro de um `useState` exigiria um `useEffect` de
   * sincronizacao, e ele repetiria a conversa toda vez que a consulta
   * revalidasse.
   */
  const [sessionMessages, setSessionMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { data: history = [] } = useQuery({
    queryKey: [CHAT_HISTORY_QUERY_KEY, conversationId],
    queryFn: async () =>
      toScreenMessages(await api.entities.ChatMessage.listByConversation(conversationId)),
  });

  const messages = [...history, ...sessionMessages];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * `messages` e' derivado, entao e' um array novo a cada render: depender dele
   * mandaria a tela rolar sem parar. Quem manda rolar e' a conversa ter crescido.
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  /**
   * Guardar e' o que faz a conversa sobreviver a fechar o app, mas falhar em
   * guardar nao pode apagar da tela o que o pai acabou de ler: o erro fica no
   * console e a mensagem continua ali.
   */
  const remember = async (message) => {
    try {
      await api.entities.ChatMessage.create({ conversationId, ...message });
    } catch (error) {
      console.error('Nao foi possivel guardar a mensagem:', error);
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = { role: 'user', content: text };
    setSessionMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      await remember(userMessage);

      /**
       * Quem sao os filhos e qual a orientacao do pai nao viajam mais daqui: a
       * API ja conhece o pai autenticado e monta o contexto do lado dela
       * (`security.md` §1). A tela manda a pergunta, so.
       *
       * `POST /v1/chat` responde e NAO grava: as duas pontas da conversa sao
       * escritas aqui, na ordem em que foram ditas.
       */
      const response = await api.ai.chat(text);

      const assistantMessage = { role: 'assistant', content: response };
      setSessionMessages(prev => [...prev, assistantMessage]);
      await remember(assistantMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      /** Recado de falha nao e' conversa: nao vai para o historico. */
      setSessionMessages(prev => [...prev, { role: 'assistant', content: FAILURE_REPLY }]);
    }

    setIsLoading(false);
    inputRef.current?.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Header */}
      <div className="bg-zinc-900/80 backdrop-blur-lg border-b border-zinc-800 px-4 py-4 flex items-center gap-3">
        <img src={BRAND_LOGO} alt="Entre Nós" className="w-10 h-10 rounded-xl" />
        <div>
          <h1 className="font-medium text-white">Mentor Entre Nós</h1>
          <p className="text-xs text-zinc-500">Tire suas dúvidas sobre parentalidade</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-32">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
              <Lightbulb className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-lg font-medium text-white mb-2">
              Como posso ajudar?
            </h2>
            <p className="text-zinc-500 text-sm mb-6 max-w-xs">
              Estou aqui para orientá-lo sobre comunicação positiva e criação consciente.
            </p>
            
            <div className="space-y-2 w-full max-w-sm">
              <p className="text-xs text-zinc-600 uppercase tracking-wide">Sugestões</p>
              {suggestedQuestions.map((question, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => sendMessage(question)}
                  className="w-full text-left p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-sm text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700 transition-all"
                >
                  {question}
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-blue-400/20 flex-shrink-0 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-blue-400" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-emerald-400 text-white'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <p className="text-sm">{message.content}</p>
                    ) : (
                      <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        {message.content}
                      </ReactMarkdown>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center">
                      <User className="w-4 h-4 text-zinc-400" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-blue-400/20 flex-shrink-0 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3">
                  <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="fixed bottom-20 left-0 right-0 bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-800 px-4 py-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua dúvida..."
            className="flex-1 h-12 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon"
            className="h-12 w-12 bg-gradient-to-r from-blue-500 to-emerald-400 hover:from-blue-600 hover:to-emerald-500 text-white"
            disabled={!input.trim() || isLoading}
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}