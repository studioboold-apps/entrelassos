import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Heart, Wallet, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import RatingButton from '@/components/ui/RatingButton';

const categoryConfig = {
  comportamento: { 
    icon: Brain, 
    gradient: 'from-blue-500/10 to-indigo-500/10',
    border: 'border-blue-500/20',
    iconColor: 'text-blue-400'
  },
  sexualidade: { 
    icon: Heart, 
    gradient: 'from-emerald-400/10 to-teal-400/10',
    border: 'border-emerald-400/20',
    iconColor: 'text-emerald-400'
  },
  financeira: { 
    icon: Wallet, 
    gradient: 'from-sky-400/10 to-blue-400/10',
    border: 'border-sky-400/20',
    iconColor: 'text-sky-400'
  },
  saude: { 
    icon: Activity, 
    gradient: 'from-teal-400/10 to-emerald-400/10',
    border: 'border-teal-400/20',
    iconColor: 'text-teal-400'
  }
};

const categoryLabels = {
  comportamento: 'Comportamento',
  sexualidade: 'Sexualidade',
  financeira: 'Financeira',
  saude: 'Saúde'
};

export default function InsightCard({ 
  id,
  title, 
  content, 
  category, 
  childName,
  rating,
  onRate,
  delay = 0 
}) {
  const config = categoryConfig[category] || categoryConfig.comportamento;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={cn(
        "rounded-2xl p-5 border bg-gradient-to-br",
        config.gradient,
        config.border
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={cn("p-2 rounded-xl bg-zinc-900/50", config.iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            {categoryLabels[category]}
          </span>
          {childName && (
            <p className="text-xs text-zinc-600">Para {childName}</p>
          )}
        </div>
      </div>

      <h3 className="text-base font-medium text-zinc-100 mb-2 leading-tight">
        {title}
      </h3>

      <p className="text-zinc-400 text-sm leading-relaxed mb-4">
        {content}
      </p>

      <div className="flex justify-end">
        <RatingButton 
          currentRating={rating} 
          onRate={(r) => onRate(id, r)} 
        />
      </div>
    </motion.div>
  );
}