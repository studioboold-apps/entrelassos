import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Loader2, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { BRAND_LOGO } from '@/lib/brand';
import { useTranslation } from '@/lib/i18n';
import { MESSAGE_ROLES, SUGGESTED_QUESTION_KEYS, useChat } from './Chat.hook';

export default function Chat() {
  const { t } = useTranslation();
  const {
    question,
    messages,
    sendFailure,
    isSending,
    canSend,
    messagesEndRef,
    inputRef,
    handleQuestionChange,
    handleSubmit,
    sendQuestion,
  } = useChat();

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Header */}
      <div className="bg-zinc-900/80 backdrop-blur-lg border-b border-zinc-800 px-4 py-4 flex items-center gap-3">
        <img src={BRAND_LOGO} alt={t('chat.brandLogoAlt')} className="w-10 h-10 rounded-xl" />
        <div>
          <h1 className="font-medium text-white">{t('chat.title')}</h1>
          <p className="text-xs text-zinc-500">{t('chat.subtitle')}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-32">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
              <Lightbulb aria-hidden="true" className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-lg font-medium text-white mb-2">{t('chat.emptyTitle')}</h2>
            <p className="text-zinc-500 text-sm mb-6 max-w-xs">{t('chat.emptyBody')}</p>

            <div className="space-y-2 w-full max-w-sm">
              <p className="text-xs text-zinc-600 uppercase tracking-wide">
                {t('chat.suggestionsLabel')}
              </p>
              {SUGGESTED_QUESTION_KEYS.map((questionKey, index) => (
                <motion.button
                  key={questionKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => sendQuestion(t(questionKey))}
                  className="w-full text-left p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-sm text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700 transition-all"
                >
                  {t(questionKey)}
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
                  className={`flex gap-3 ${message.role === MESSAGE_ROLES.USER ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === MESSAGE_ROLES.ASSISTANT && (
                    <div
                      aria-label={t('chat.assistantAvatarLabel')}
                      className="w-8 h-8 rounded-full bg-blue-400/20 flex-shrink-0 flex items-center justify-center"
                    >
                      <Bot aria-hidden="true" className="w-4 h-4 text-blue-400" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === MESSAGE_ROLES.USER
                        ? 'bg-gradient-to-r from-blue-500 to-emerald-400 text-white'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                    }`}
                  >
                    {message.role === MESSAGE_ROLES.USER ? (
                      <p className="text-sm">{message.content}</p>
                    ) : (
                      <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        {message.content}
                      </ReactMarkdown>
                    )}
                  </div>

                  {message.role === MESSAGE_ROLES.USER && (
                    <div
                      aria-label={t('chat.userAvatarLabel')}
                      className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center"
                    >
                      <User aria-hidden="true" className="w-4 h-4 text-zinc-400" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isSending && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-blue-400/20 flex-shrink-0 flex items-center justify-center">
                  <Bot aria-hidden="true" className="w-4 h-4 text-blue-400" />
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3">
                  <Loader2 aria-hidden="true" className="w-5 h-5 text-zinc-500 animate-spin" />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="fixed bottom-20 left-0 right-0 bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-800 px-4 py-3">
        {sendFailure && (
          <p role="alert" className="text-sm text-red-400 mb-2">
            {sendFailure.message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={question}
            onChange={handleQuestionChange}
            placeholder={t('chat.inputPlaceholder')}
            className="flex-1 h-12 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            disabled={isSending}
          />
          <Button
            type="submit"
            size="icon"
            aria-label={t('chat.send')}
            className="h-12 w-12 bg-gradient-to-r from-blue-500 to-emerald-400 hover:from-blue-600 hover:to-emerald-500 text-white"
            disabled={!canSend}
          >
            <Send aria-hidden="true" className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
