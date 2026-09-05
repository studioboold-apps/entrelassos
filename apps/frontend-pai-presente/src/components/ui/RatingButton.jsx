import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function RatingButton({ onRate, currentRating, size = 'md' }) {
  const [showRating, setShowRating] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleRate = (rating) => {
    onRate(rating);
    setShowRating(false);
  };

  if (currentRating) {
    return (
      <div className="flex items-center gap-1 text-emerald-400">
        <Star className={cn(sizes[size], "fill-current")} />
        <span className="text-sm font-medium">{currentRating}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowRating(!showRating)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-400 text-sm"
      >
        <Star className={cn(sizes[size])} />
        <span>Avaliar</span>
      </button>

      <AnimatePresence>
        {showRating && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-zinc-800 rounded-xl shadow-xl border border-zinc-700 p-3 z-50"
          >
            <p className="text-xs text-zinc-500 mb-2 text-center whitespace-nowrap">
              Esta dica foi útil?
            </p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => handleRate(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "w-6 h-6 transition-colors",
                      star <= hoveredStar
                        ? "text-emerald-400 fill-emerald-400"
                        : "text-zinc-600"
                    )}
                  />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}