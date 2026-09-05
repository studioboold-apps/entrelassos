import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Sparkles,
  Loader2,
  Heart,
  Tent,
  BookOpen,
  Dumbbell,
  Palette,
  TreePine,
  ChefHat,
  Gamepad2,
  School,
  GraduationCap,
  Wrench
} from 'lucide-react';
import ActivityCard from '@/components/ActivityCard';

const BRAND_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69693b3d8c5d3c2fd0c67ca4/bdaa51aa4_ChatGPTImage15_01_202616_47_55.png";

const categories = [
  { id: 'aventura', label: 'Aventura', icon: Tent },
  { id: 'educativa', label: 'Educativa', icon: BookOpen },
  { id: 'esportiva', label: 'Esportiva', icon: Dumbbell },
  { id: 'criativa', label: 'Criativa', icon: Palette },
  { id: 'natureza', label: 'Natureza', icon: TreePine },
  { id: 'culinaria', label: 'Culinária', icon: ChefHat },
  { id: 'jogos', label: 'Jogos', icon: Gamepad2 },
  { id: 'escolar', label: 'Escolar', icon: School },
  { id: 'cursos', label: 'Cursos', icon: GraduationCap },
  { id: 'oficinas', label: 'Oficinas', icon: Wrench },
];

export default function Juntinhos() {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNewActivity, setShowNewActivity] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '',
    child_id: '',
    child_name: '',
    category: ''
  });

  const { data: children = [] } = useQuery({
    queryKey: ['children'],
    queryFn: () => base44.entities.Child.list(),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list(),
  });

  const createActivityMutation = useMutation({
    mutationFn: (data) => base44.entities.Activity.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setShowNewActivity(false);
      resetForm();
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Activity.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  const resetForm = () => {
    setNewActivity({
      title: '',
      description: '',
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: '',
      child_id: '',
      child_name: '',
      category: ''
    });
  };

  const handleCreateActivity = () => {
    const child = children.find(c => c.id === newActivity.child_id);
    createActivityMutation.mutate({
      ...newActivity,
      child_name: child?.name || '',
      is_suggested: false,
      completed: false
    });
  };

  const handleComplete = (activity) => {
    updateActivityMutation.mutate({
      id: activity.id,
      data: { ...activity, completed: true }
    });
  };

  const handleRate = (activityId, rating) => {
    const activity = activities.find(a => a.id === activityId);
    updateActivityMutation.mutate({
      id: activityId,
      data: { ...activity, rating }
    });
  };

  const generateSuggestions = async () => {
    if (children.length === 0) return;
    
    setLoadingSuggestions(true);
    try {
      const currentSeason = getCurrentSeason();
      const childrenInfo = children.map(c => `${c.name} (${c.age} anos)`).join(', ');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Sugira 4 atividades criativas para um pai fazer com seus filhos.

Filhos: ${childrenInfo}
Estação do ano atual: ${currentSeason}
Mês: ${format(currentMonth, 'MMMM', { locale: ptBR })}

Considere:
- Atividades apropriadas para a estação (${currentSeason})
- Idade das crianças
- Mix de atividades indoor e outdoor
- Atividades que fortaleçam o vínculo pai-filho

Para cada sugestão, especifique a categoria: aventura, educativa, esportiva, criativa, natureza, culinaria, jogos, escolar (eventos escolares como reuniões, provas, festivais), cursos (cursos extracurriculares como idiomas, música, robótica) ou oficinas (oficinas e workshops como arte, marcenaria, cozinha experimental)`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" },
                  child_name: { type: "string" }
                }
              }
            }
          }
        }
      });

      setSuggestions(response.suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }
    setLoadingSuggestions(false);
  };

  const getCurrentSeason = () => {
    const month = currentMonth.getMonth();
    if (month >= 2 && month <= 4) return 'outono';
    if (month >= 5 && month <= 7) return 'inverno';
    if (month >= 8 && month <= 10) return 'primavera';
    return 'verão';
  };

  const acceptSuggestion = (suggestion) => {
    createActivityMutation.mutate({
      title: suggestion.title,
      description: suggestion.description,
      category: suggestion.category,
      date: format(selectedDate, 'yyyy-MM-dd'),
      child_name: suggestion.child_name || children[0]?.name || '',
      is_suggested: true,
      completed: false
    });
    setShowSuggestions(false);
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const activitiesForSelectedDate = activities.filter(a => 
    isSameDay(new Date(a.date), selectedDate)
  );

  const daysWithActivities = activities.map(a => new Date(a.date));

  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const firstDayOfMonth = startOfMonth(currentMonth).getDay();

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* Header */}
      <div className="px-6 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <img src={BRAND_LOGO} alt="Entre Nós" className="w-12 h-12 rounded-xl" />
          <span className="text-emerald-400 font-medium">Juntinhos</span>
        </div>
        <h1 className="text-2xl font-light text-white">
          Momentos Especiais
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Planeje atividades com seus filhos
        </p>
      </div>

      {/* Calendar */}
      <div className="px-4 mb-6">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-zinc-400" />
            </button>
            <h2 className="font-medium text-white capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-zinc-400" />
            </button>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day, i) => (
              <div key={i} className="text-center text-xs text-zinc-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array(firstDayOfMonth).fill(null).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map(day => {
              const hasActivity = daysWithActivities.some(d => isSameDay(d, day));
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    relative aspect-square rounded-xl text-sm font-medium transition-all
                    ${isSelected 
                      ? 'bg-gradient-to-r from-blue-500 to-emerald-400 text-white' 
                      : isToday 
                        ? 'bg-zinc-800 text-blue-400'
                        : 'hover:bg-zinc-800 text-zinc-400'
                    }
                  `}
                >
                  {format(day, 'd')}
                  {hasActivity && !isSelected && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 mb-6">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={generateSuggestions}
            disabled={loadingSuggestions || children.length === 0}
            className="flex-1 h-12 bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            {loadingSuggestions ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 mr-2 text-blue-400" />
            )}
            Sugerir
          </Button>
          <Button
            onClick={() => {
              setNewActivity(prev => ({ ...prev, date: format(selectedDate, 'yyyy-MM-dd') }));
              setShowNewActivity(true);
            }}
            className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-emerald-400 hover:from-blue-600 hover:to-emerald-500 text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Atividade
          </Button>
        </div>
      </div>

      {/* Selected Date Activities */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-white">
              {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
            </h3>
            <p className="text-sm text-zinc-500">
              {activitiesForSelectedDate.length} atividade(s)
            </p>
          </div>
        </div>

        {activitiesForSelectedDate.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900 rounded-2xl border border-dashed border-zinc-800">
            <CalendarIcon className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500">Nenhuma atividade planejada</p>
            <p className="text-sm text-zinc-600 mt-1">
              Adicione ou peça sugestões
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activitiesForSelectedDate.map((activity, index) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onComplete={handleComplete}
                onRate={handleRate}
                delay={index * 0.1}
              />
            ))}
          </div>
        )}
      </div>

      {/* New Activity Dialog */}
      <Dialog open={showNewActivity} onOpenChange={setShowNewActivity}>
        <DialogContent className="max-w-md bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Nova Atividade</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-400">Título</Label>
              <Input
                value={newActivity.title}
                onChange={(e) => setNewActivity(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Passeio no parque"
                className="mt-1.5 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
              />
            </div>

            <div>
              <Label className="text-zinc-400">Descrição</Label>
              <Textarea
                value={newActivity.description}
                onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detalhes da atividade..."
                className="mt-1.5 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-400">Data</Label>
                <Input
                  type="date"
                  value={newActivity.date}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, date: e.target.value }))}
                  className="mt-1.5 bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div>
                <Label className="text-zinc-400">Horário</Label>
                <Input
                  type="time"
                  value={newActivity.time}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, time: e.target.value }))}
                  className="mt-1.5 bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-zinc-400">Filho</Label>
              <Select
                value={newActivity.child_id}
                onValueChange={(v) => setNewActivity(prev => ({ ...prev, child_id: v }))}
              >
                <SelectTrigger className="mt-1.5 bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {children.map(child => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-zinc-400">Categoria</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {categories.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setNewActivity(prev => ({ ...prev, category: cat.id }))}
                      className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                        newActivity.category === cat.id
                          ? 'bg-gradient-to-r from-blue-500 to-emerald-400 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[10px]">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-emerald-400 hover:from-blue-600 hover:to-emerald-500 text-white"
              onClick={handleCreateActivity}
              disabled={!newActivity.title || createActivityMutation.isPending}
            >
              {createActivityMutation.isPending ? 'Salvando...' : 'Criar Atividade'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Suggestions Dialog */}
      <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Sparkles className="w-5 h-5 text-blue-400" />
              Sugestões
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-zinc-800 rounded-xl border border-zinc-700"
              >
                <h4 className="font-medium text-white">{suggestion.title}</h4>
                <p className="text-sm text-zinc-400 mt-1">{suggestion.description}</p>
                {suggestion.child_name && (
                  <p className="text-xs text-zinc-500 mt-2">Para: {suggestion.child_name}</p>
                )}
                <Button
                  size="sm"
                  className="w-full mt-3 bg-gradient-to-r from-blue-500 to-emerald-400 hover:from-blue-600 hover:to-emerald-500 text-white"
                  onClick={() => acceptSuggestion(suggestion)}
                >
                  Adicionar ao calendário
                </Button>
              </motion.div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}