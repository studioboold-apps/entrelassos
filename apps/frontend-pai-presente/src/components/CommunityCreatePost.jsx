import React, { useState } from 'react';
import { api } from '@/api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Send } from 'lucide-react';
import { COMMUNITY_CATEGORIES, DEFAULT_COMMUNITY_CATEGORY } from '@/lib/community-categories';
import { useTranslation } from '@/lib/i18n';

export default function CommunityCreatePost() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(DEFAULT_COMMUNITY_CATEGORY.id);

  const createPostMutation = useMutation({
    mutationFn: (data) => api.entities.CommunityPost.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setContent('');
      setCategory(DEFAULT_COMMUNITY_CATEGORY.id);
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) return;
    /**
    * So o que e do post. Autor sai do token e a contagem de curtidas sai do
    * banco; mandar os dois daqui era deixar o cliente assinar em nome de outro
    * e estrear com o placar que quisesse.
    */
    createPostMutation.mutate({ content, category });
  };

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t('community.create.placeholder')}
        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 resize-none min-h-[80px] mb-3"
      />
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {COMMUNITY_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full font-medium transition-all",
                category === cat.id
                  ? "bg-gradient-to-r from-blue-500 to-emerald-400 text-white"
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
          disabled={!content.trim() || createPostMutation.isPending}
          className="bg-gradient-to-r from-blue-500 to-emerald-400 text-white flex-shrink-0"
        >
          <Send className="w-4 h-4 mr-1" />
          {t('community.create.publish')}
        </Button>
      </div>
    </div>
  );
}