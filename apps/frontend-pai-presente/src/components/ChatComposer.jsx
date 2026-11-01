import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImagePlus, Loader2, Mic, Send, Square, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

/**
 * A caixa de pergunta do chat: texto, foto e microfone. So' desenha — quem
 * decide e' `useChat` (`web.md` §4); tudo chega por props.
 */
export default function ChatComposer({
  question,
  sendFailure,
  attachmentFailure,
  isSending,
  canSend,
  inputRef,
  handleQuestionChange,
  handleSubmit,
  photo,
  voice,
}) {
  const { t } = useTranslation();
  const isBusy = isSending || voice.isRecording || voice.isTranscribing;
  const failure = sendFailure?.message ?? attachmentFailure;

  return (
    <div className="fixed bottom-20 left-0 right-0 bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-800 px-4 py-3">
      {failure && (
        <p role="alert" className="text-sm text-red-600 mb-2">
          {failure}
        </p>
      )}

      {photo.previewUrl && (
        <div className="flex items-center gap-3 mb-2">
          <div className="relative">
            <img
              src={photo.previewUrl}
              alt={t('chat.photoPreviewAlt')}
              className="h-16 w-16 rounded-lg object-cover border border-zinc-700"
            />
            <button
              type="button"
              onClick={photo.remove}
              aria-label={t('chat.photoRemove')}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center"
            >
              <X aria-hidden="true" className="w-3 h-3 text-zinc-300" />
            </button>
          </div>
          <p className="text-xs text-zinc-500">{t('chat.photoPrivacy')}</p>
        </div>
      )}

      {(voice.isRecording || voice.isTranscribing) && (
        <p role="status" className="text-xs text-emerald-600 mb-2">
          {voice.isRecording ? t('chat.recording') : t('chat.transcribing')}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={photo.inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={photo.handleChange}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={t('chat.photoAttach')}
          onClick={photo.open}
          disabled={isBusy}
          className="h-12 w-10 text-zinc-400 hover:text-zinc-100"
        >
          <ImagePlus aria-hidden="true" className="w-5 h-5" />
        </Button>
        <Input
          ref={inputRef}
          value={question}
          onChange={handleQuestionChange}
          placeholder={t('chat.inputPlaceholder')}
          className="flex-1 h-12 bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
          disabled={isBusy}
        />
        {voice.isSupported && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={voice.isRecording ? t('chat.voiceStop') : t('chat.voiceStart')}
            aria-pressed={voice.isRecording}
            onClick={voice.toggle}
            disabled={isSending || voice.isTranscribing}
            className={`h-12 w-10 ${voice.isRecording ? 'text-red-600 animate-pulse' : 'text-zinc-400 hover:text-zinc-100'}`}
          >
            {voice.isTranscribing ? (
              <Loader2 aria-hidden="true" className="w-5 h-5 animate-spin" />
            ) : voice.isRecording ? (
              <Square aria-hidden="true" className="w-5 h-5" />
            ) : (
              <Mic aria-hidden="true" className="w-5 h-5" />
            )}
          </Button>
        )}
        <Button
          type="submit"
          size="icon"
          aria-label={t('chat.send')}
          className="h-12 w-12 bg-gradient-to-r from-blue-500 to-amber-500 hover:from-blue-600 hover:to-amber-600 text-white"
          disabled={!canSend || isBusy}
        >
          <Send aria-hidden="true" className="w-5 h-5" />
        </Button>
      </form>
    </div>
  );
}
