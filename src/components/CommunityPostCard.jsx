import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const categoryConfig = {
  experiencia: { label: 'Experiência', color: 'text-blue-400 bg-blue-400/10' },
  dica: { label: 'Dica', color: 'text-emerald-400 bg-emerald-400/10' },
  duvida: { label: 'Dúvida', color: 'text-yellow-400 bg-yellow-400/10' },
  conquista: { label: 'Conquista', color: 'text-purple-400 bg-purple-400/10' },
};

export default function CommunityPostCard({ post, currentUser, delay = 0 }) {
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', post.id],
    queryFn: () => base44.entities.CommunityComment.filter({ post_id: post.id }),
    enabled: showComments,
  });

  const likeMutation = useMutation({
    mutationFn: () => {
      const liked = post.liked_by?.includes(currentUser?.id);
      const newLikedBy = liked
        ? post.liked_by.filter(id => id !== currentUser.id)
        : [...(post.liked_by || []), currentUser.id];
      return base44.entities.CommunityPost.update(post.id, {
        likes_count: newLikedBy.length,
        liked_by: newLikedBy,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });

  const commentMutation = useMutation({
    mutationFn: (data) => base44.entities.CommunityComment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', post.id] });
      setCommentText('');
    },
  });

  const hasLiked = post.liked_by?.includes(currentUser?.id);
  const catConfig = categoryConfig[post.category] || categoryConfig.experiencia;

  const handleComment = () => {
    if (!commentText.trim()) return;
    commentMutation.mutate({
      post_id: post.id,
      content: commentText,
      author_name: currentUser?.full_name || 'Pai',
      author_id: currentUser?.id,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400/20 to-emerald-400/20 border border-blue-400/30 flex items-center justify-center text-blue-400 font-medium">
          {post.author_name?.[0] || 'P'}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-white text-sm">{post.author_name}</p>
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", catConfig.color)}>
              {catConfig.label}
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            {format(new Date(post.created_date), "d 'de' MMM 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>

      <p className="text-zinc-300 text-sm leading-relaxed mb-3 whitespace-pre-wrap">{post.content}</p>

      <div className="flex items-center gap-4 pt-3 border-t border-zinc-800">
        <button
          onClick={() => likeMutation.mutate()}
          className={cn(
            "flex items-center gap-1.5 text-sm transition-colors",
            hasLiked ? "text-red-400" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          <Heart className={cn("w-4 h-4", hasLiked && "fill-current")} />
          <span>{post.likes_count || 0}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Comentar</span>
        </button>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-400 flex-shrink-0">
                    {comment.author_name?.[0] || 'P'}
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl px-3 py-2 flex-1">
                    <p className="text-xs font-medium text-zinc-300">{comment.author_name}</p>
                    <p className="text-sm text-zinc-400">{comment.content}</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escreva um comentário..."
                  className="bg-zinc-800 border-zinc-700 text-white text-sm placeholder:text-zinc-600"
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                />
                <Button
                  size="icon"
                  onClick={handleComment}
                  disabled={!commentText.trim() || commentMutation.isPending}
                  className="bg-gradient-to-r from-blue-500 to-emerald-400 text-white flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}