import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/api/client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { Brain, Heart, Wallet, Activity, Loader2, RefreshCw, Calendar, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import InsightCard from '@/components/InsightCard';
import { BRAND_LOGO } from '@/lib/brand';


const categories = [
  { id: 'comportamento', label: 'Comportamento', icon: Brain, color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30' },
  { id: 'sexualidade', label: 'Sexualidade', icon: Heart, color: 'from-emerald-400/20 to-teal-400/20 border-emerald-400/30' },
  { id: 'financeira', label: 'Financeira', icon: Wallet, color: 'from-blue-400/20 to-sky-400/20 border-blue-400/30' },
  { id: 'saude', label: 'Saúde', icon: Activity, color: 'from-teal-400/20 to-emerald-400/20 border-teal-400/30' },
];

export default function Home() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [ratings, setRatings] = useState({});

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.auth.me(),
  });

  const { data: children = [] } = useQuery({
    queryKey: ['children'],
    queryFn: () => api.entities.Child.list(),
  });

  const { data: savedRatings = [] } = useQuery({
    queryKey: ['insightRatings'],
    queryFn: () => api.entities.InsightRating.list(),
  });

  useEffect(() => {
    if (user && !user.onboarding_completed) {
      navigate(createPageUrl('Onboarding'));
    }
  }, [user, navigate]);

  useEffect(() => {
    const ratingsMap = {};
    savedRatings.forEach(r => {
      ratingsMap[r.insight_id] = r.rating;
    });
    setRatings(ratingsMap);
  }, [savedRatings]);

  useEffect(() => {
    if (children.length > 0 && user) {
      generateInsights();
    } else if (user?.onboarding_completed) {
      setLoadingInsights(false);
    }
  }, [children, user]);

  const generateInsights = async (category = null) => {
    setLoadingInsights(true);
    try {
      /**
       * O prompt saiu do navegador: ele montava a pergunta com a orientacao
       * religiosa e politica do pai, e dado sensivel nao trafega na aba de rede
       * (`security.md` §1). Agora a API monta e a tela so pede o resultado.
       */
      const generated = await api.ai.insights(category ?? undefined);

      setInsights(generated.map((insight, index) => ({
        ...insight,
        id: `insight_${Date.now()}_${index}`
      })));
    } catch (error) {
      console.error('Error generating insights:', error);
    }
    setLoadingInsights(false);
  };

  const handleCategoryClick = (categoryId) => {
    if (activeCategory === categoryId) {
      setActiveCategory(null);
      generateInsights();
    } else {
      setActiveCategory(categoryId);
      generateInsights(categoryId);
    }
  };

  const handleRate = async (insightId, rating) => {
    const insight = insights.find(i => i.id === insightId);
    
    setRatings(prev => ({ ...prev, [insightId]: rating }));
    
    await api.entities.InsightRating.rate({
      insight_id: insightId,
      category: insight.category,
      rating: rating,
      insight_title: insight.title
    });
  };

  const filteredInsights = activeCategory 
    ? insights.filter(i => i.category === activeCategory)
    : insights;

  const firstName = user?.full_name?.split(' ')[0] || 'Pai';

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* Header */}
      <div className="px-6 pt-10 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <img src={BRAND_LOGO} alt="Entre Nós" className="w-12 h-12 rounded-xl" />
            <span className="text-blue-400 font-medium">Entre Nós</span>
          </div>
          <h1 className="text-2xl font-light text-white">
            Olá, <span className="font-medium">{firstName}</span>
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Insights personalizados para sua jornada
          </p>
        </motion.div>
      </div>

      {/* Category Grid - 3 columns */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-3 gap-3">
          {categories.map((cat, index) => {
            const isActive = activeCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleCategoryClick(cat.id)}
                className={`
                  aspect-square rounded-2xl p-4 flex flex-col items-center justify-center gap-2
                  border transition-all duration-300
                  ${isActive 
                    ? `bg-gradient-to-br ${cat.color} border-blue-400/50` 
                    : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                  }
                `}
              >
                <cat.icon className={`w-8 h-8 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                <span className={`text-xs text-center leading-tight ${isActive ? 'text-white' : 'text-zinc-500'}`}>
                  {cat.label}
                </span>
              </motion.button>
            );
          })}
          
          {/* Refresh button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            onClick={() => generateInsights(activeCategory)}
            disabled={loadingInsights}
            className="aspect-square rounded-2xl p-4 flex flex-col items-center justify-center gap-2
              bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all"
          >
            <RefreshCw className={`w-8 h-8 text-zinc-400 ${loadingInsights ? 'animate-spin' : ''}`} />
            <span className="text-xs text-zinc-500">Atualizar</span>
          </motion.button>
        </div>
      </div>

      {/* Quick Access Section */}
      <div className="px-6 mb-8">
        <h3 className="text-white font-medium mb-4">Acesso Rápido</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link to={createPageUrl('Juntinhos')}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-2xl p-4 flex flex-col items-center gap-2"
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-white text-sm font-medium">Juntinhos</span>
              <span className="text-zinc-500 text-xs text-center">Planeje atividades</span>
            </motion.div>
          </Link>
          
          <Link to={createPageUrl('Chat')}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-2xl p-4 flex flex-col items-center gap-2"
            >
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-white text-sm font-medium">Tire Dúvidas</span>
              <span className="text-zinc-500 text-xs text-center">Chat de apoio</span>
            </motion.div>
          </Link>
        </div>
      </div>

      {/* Insights */}
      <div className="px-6">
        <h2 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">
          {activeCategory ? categories.find(c => c.id === activeCategory)?.label : 'Todos os Insights'}
        </h2>

        {loadingInsights ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-4" />
            <p className="text-zinc-500">Gerando insights...</p>
          </div>
        ) : filteredInsights.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-500">
              {children.length === 0 
                ? 'Cadastre seus filhos para receber insights'
                : 'Nenhum insight disponível'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInsights.map((insight, index) => (
              <InsightCard
                key={insight.id}
                {...insight}
                rating={ratings[insight.id]}
                onRate={handleRate}
                delay={index * 0.1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}