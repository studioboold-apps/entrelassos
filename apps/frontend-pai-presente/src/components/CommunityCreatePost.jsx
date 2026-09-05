import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Send, X } from 'lucide-react';

const categories = [
  { id: 'experiencia', label: 'Experiência' },
  { id: 'dica', label: 'Dica' },
  { id: 'duvida', label: 'Dúvida' },
  { id: 'conquista', label: 'Conquista' },
];

export default function CommunityCreatePost({ user }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('experiencia');

  const createPostMutation = useMutation({
    mutationFn: (data) => base44.entities.CommunityPost.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setContent('');
      setCategory('experiencia');
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) return;
    createPostMutation.mutate({
      content,
      author_name: user?.full_name || 'Pai',
      author_id: user?.id,
      category,
      likes_count: 0,
      liked_by: [],
    });
  };

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Compartilhe sua experiência, dica ou dúvida com a comunidade..."
        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 resize-none min-h-[80px] mb-3"
      />
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
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
              {cat.label}
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
          Publicar
        </Button>
      </div>
    </div>
  );
}