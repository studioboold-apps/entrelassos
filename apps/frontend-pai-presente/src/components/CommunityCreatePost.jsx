import React, { useId, useState } from 'react';
import { api } from '@/api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ImagePlus, Loader2, Send, X } from 'lucide-react';
import { toPostImageDataUrl } from '@/lib/avatar-image';
import { COMMUNITY_CATEGORIES, DEFAULT_COMMUNITY_CATEGORY } from '@/lib/community-categories';
import { describeApiFailure } from '@/lib/api-error-message';
import { useTranslation } from '@/lib/i18n';

export default function CommunityCreatePost() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(DEFAULT_COMMUNITY_CATEGORY.id);
  const [image, setImage] = useState(null);
  const [isReadingImage, setIsReadingImage] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const photoInputId = useId();

  /** A foto e' reduzida aqui, antes do envio: a da camera tem megabytes. */
  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setIsReadingImage(true);
    setImageFailed(false);
    try {
      setImage(await toPostImageDataUrl(file));
    } catch {
      setImageFailed(true);
    }
    setIsReadingImage(false);
  }

  const createPostMutation = useMutation({
    mutationFn: (data) => api.entities.CommunityPost.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setContent('');
      setCategory(DEFAULT_COMMUNITY_CATEGORY.id);
      setImage(null);
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) return;
    /**
    * So o que e do post. Autor sai do token e a contagem de curtidas sai do
    * banco; mandar os dois daqui era deixar o cliente assinar em nome de outro
    * e estrear com o placar que quisesse.
    */
    createPostMutation.mutate({ content, category, ...(image ? { image } : {}) });
  };

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t('community.create.placeholder')}
        className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 resize-none min-h-[80px] mb-3"
      />
      {image && (
        <div className="relative mb-3">
          <img src={image} alt={t('community.create.photoAlt')} className="w-full max-h-72 rounded-xl object-cover" />
          <button
            type="button"
            onClick={() => setImage(null)}
            aria-label={t('community.create.removePhoto')}
            className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100/80 text-white hover:bg-zinc-100"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      )}
      {createPostMutation.isError && (
        <p role="alert" className="text-xs text-red-600 mb-3">
          {describeApiFailure(createPostMutation.error).message}
        </p>
      )}
      {imageFailed && (
        <p role="alert" className="text-xs text-red-600 mb-3">
          {t('community.create.photoUnreadable')}
        </p>
      )}
      <label
        htmlFor={photoInputId}
        className="mb-3 inline-flex cursor-pointer items-center gap-2 rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-blue-500 hover:text-blue-600"
      >
        {isReadingImage ? (
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <ImagePlus aria-hidden="true" className="h-4 w-4 text-blue-600" />
        )}
        {image ? t('community.create.changePhoto') : t('community.create.addPhoto')}
      </label>
      <input id={photoInputId} type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {COMMUNITY_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full font-medium transition-all",
                category === cat.id
                  ? "bg-gradient-to-r from-blue-500 to-amber-500 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              )}
            >
              {t(cat.labelKey)}
            </button>
          ))}
        </div>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!content.trim() || isReadingImage || createPostMutation.isPending}
          className="bg-gradient-to-r from-blue-500 to-amber-500 text-white flex-shrink-0"
        >
          <Send className="w-4 h-4 mr-1" />
          {t('community.create.publish')}
        </Button>
      </div>
    </div>
  );
}