import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, CheckCircle, Tent, BookOpen, Dumbbell, Palette, TreePine, ChefHat, Gamepad2, School, GraduationCap, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import RatingButton from '@/components/ui/RatingButton';

const categoryConfig = {
  aventura: { icon: Tent, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
  educativa: { icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  esportiva: { icon: Dumbbell, color: 'text-teal-400', bg: 'bg-teal-400/10 border-teal-400/20' },
  criativa: { icon: Palette, color: 'text-sky-400', bg: 'bg-sky-400/10 border-sky-400/20' },
  natureza: { icon: TreePine, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  culinaria: { icon: ChefHat, color: 'text-blue-300', bg: 'bg-blue-300/10 border-blue-300/20' },
  jogos: { icon: Gamepad2, color: 'text-teal-300', bg: 'bg-teal-300/10 border-teal-300/20' },
  escolar: { icon: School, color: 'text-indigo-400', bg: 'bg-indigo-400/10 border-indigo-400/20' },
  cursos: { icon: GraduationCap, color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },
  oficinas: { icon: Wrench, color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' }
};

export default function ActivityCard({ 
  activity, 
  onComplete, 
  onRate,
  delay = 0 
}) {
  const isPast = new Date(activity.date) < new Date();
  const config = categoryConfig[activity.category] || categoryConfig.aventura;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(
        "rounded-2xl p-4 border transition-all",
        config.bg,
        activity.completed && "opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2.5 rounded-xl bg-zinc-900/50", config.color)}>
          <Icon className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {activity.is_suggested && (
              <span className="text-[10px] px-2 py-0.5 bg-blue-400/20 text-blue-400 rounded-full font-medium">
                Sugestão
              </span>
            )}
            {activity.completed && (
              <span className="text-[10px] px-2 py-0.5 bg-emerald-400/20 text-emerald-400 rounded-full font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Realizada
              </span>
            )}
          </div>

          <h4 className="font-medium text-white mb-1">
            {activity.title}
          </h4>

          {activity.description && (
            <p className="text-sm text-zinc-400 mb-2 line-clamp-2">
              {activity.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(activity.date), "d 'de' MMM", { locale: ptBR })}
            </span>
            {activity.time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {activity.time}
              </span>
            )}
            {activity.child_name && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {activity.child_name}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800/50">
        {!activity.completed && isPast ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onComplete(activity)}
            className="text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/10 bg-transparent"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Marcar como realizada
          </Button>
        ) : (
          <div />
        )}

        {activity.completed && (
          <RatingButton
            currentRating={activity.rating}
            onRate={(r) => onRate(activity.id, r)}
          />
        )}
      </div>
    </motion.div>
  );
}