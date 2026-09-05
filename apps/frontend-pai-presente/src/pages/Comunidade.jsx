import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Brain, Heart, Wallet, Activity, Loader2, RefreshCw, Users, Sparkles } from 'lucide-react';
import CommunityPostCard from '@/components/CommunityPostCard';
import CommunityCreatePost from '@/components/CommunityCreatePost';
import InsightCard from '@/components/InsightCard';
import { cn } from '@/lib/utils';
import { BRAND_LOGO } from '@/lib/brand';
import { withInsightIds } from '@/lib/insight-identity';
import { describeApiFailure } from '@/lib/api-error-message';

/** A API ja devolve o feed do mais novo para o mais antigo. */
const FEED_PAGE_SIZE = 50;


const insightCategories = [
  { id: 'comportamento', label: 'Comportamento', icon: Brain, color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30' },
  { id: 'sexualidade', label: 'Sexualidade', icon: Heart, color: 'from-emerald-400/20 to-teal-400/20 border-emerald-400/30' },
  { id: 'financeira', label: 'Financeira', icon: Wallet, color: 'from-blue-400/20 to-sky-400/20 border-blue-400/30' },
  { id: 'saude', label: 'Saúde', icon: Activity, color: 'from-teal-400/20 to-emerald-400/20 border-teal-400/30' },
];

export default function Comunidade() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('feed');
  const [activeCategory, setActiveCategory] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.auth.me(),
  });

  const { data: children = [] } = useQuery({
    queryKey: ['children'],
    queryFn: () => api.entities.Child.list(),
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['posts'],
    queryFn: () => api.entities.CommunityPost.list(FEED_PAGE_SIZE),
  });

  const { data: savedRatings = [] } = useQuery({
    queryKey: ['insightRatings'],
    queryFn: () => api.entities.InsightRating.list(),
  });

  /**
   * Pedir insight e' chamada de API, entao e' query — nao estado de tela
   * alimentado por efeito (`web.md` §5). O efeito antigo so disparava com a
   * lista vazia, o que travava a aba depois de uma falha: a lista continuava
   * vazia e a condicao continuava verdadeira, sem nunca tentar de novo.
   *
   * O prompt saiu do navegador: ele montava a pergunta com a orientacao
   * religiosa e politica do pai, e dado sensivel nao trafega na aba de rede
   * (`security.md` §1). Agora a API monta e a tela so pede o resultado.
   *
   * A identidade vem do TEXTO (`insight-identity`), nunca do relogio: ela e' a
   * chave da nota em `PUT /v1/insight-ratings/:id`, e id novo a cada geracao
   * faz a estrela do pai nunca reaparecer.
   *
   * `staleTime: Infinity` porque cada refeitura custa uma chamada de IA — quem
   * pede texto novo e' o botao de atualizar, deliberadamente.
   */
  const insightsQuery = useQuery({
    queryKey: ['insights', activeCategory],
    queryFn: async () => withInsightIds(await api.ai.insights(activeCategory ?? undefined)),
    enabled: activeTab === 'insights' && children.length > 0 && user !== undefined,
    staleTime: Infinity,
  });

  const insights = insightsQuery.data ?? [];
  const loadingInsights = insightsQuery.isFetching;

  /**
   * Sem chave, `POST /v1/insights` responde 503 `AI_NOT_CONFIGURED`. A frase
   * morria escrita no log do navegador: o pai via o carregando girar, parar, e
   * a lista vazia — que e' exatamente o que ele veria se nao houvesse insight
   * nenhum. Duas situacoes diferentes, uma tela so.
   */
  const insightsFailure = insightsQuery.isError ? describeApiFailure(insightsQuery.error) : null;

  /**
   * @param {{ insightId: string, rating: number, category: string, title: string }} params
   */
  const rateInsight = ({ insightId, rating, category, title }) =>
    api.entities.InsightRating.rate({
      insight_id: insightId,
      category,
      rating,
      insight_title: title,
    });

  const rateMutation = useMutation({
    mutationFn: rateInsight,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insightRatings'] }),
  });

  /**
   * O mapa de notas e' DERIVADO do que o servidor ja trouxe (`react.md`: nunca
   * usar efeito para transformar dado). A copia em estado divergia — reavaliar
   * mudava o mapa local e a lista salva ficava com a nota antiga ate alguem
   * recarregar a pagina.
   *
   * A estrela que acende no clique sai da propria escrita em curso, e por isso
   * nao precisa de desfazer: falhando, a tela volta sozinha ao que o servidor
   * tem.
   */
  const savedRatingsMap = Object.fromEntries(savedRatings.map(r => [r.insight_id, r.rating]));
  const pendingRating = rateMutation.isPending ? rateMutation.variables : undefined;
  const ratings = pendingRating === undefined
    ? savedRatingsMap
    : { ...savedRatingsMap, [pendingRating.insightId]: pendingRating.rating };

  /** Trocar de categoria troca a CHAVE da query, e a busca sai disso. */
  const handleCategoryClick = (categoryId) => {
    setActiveCategory(activeCategory === categoryId ? null : categoryId);
  };

  const handleRate = (insightId, rating) => {
    const insight = insights.find(i => i.id === insightId);

    if (insight === undefined) return;

    rateMutation.mutate({ insightId, rating, category: insight.category, title: insight.title });
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* Header */}
      <div className="px-6 pt-10 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <img src={BRAND_LOGO} alt="Entre Nós" className="w-12 h-12 rounded-xl" />
          <span className="text-emerald-400 font-medium">Comunidade</span>
        </div>
        <h1 className="text-2xl font-light text-white">
          Pais Presentes
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Compartilhe, aprenda e cresça junto com outros pais
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="px-6 mb-6">
        <div className="flex gap-2 bg-zinc-900 rounded-2xl p-1.5 border border-zinc-800">
          <button
            onClick={() => setActiveTab('feed')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
              activeTab === 'feed'
                ? "bg-gradient-to-r from-blue-500 to-emerald-400 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Users className="w-4 h-4" />
            Feed
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
              activeTab === 'insights'
                ? "bg-gradient-to-r from-blue-500 to-emerald-400 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Sparkles className="w-4 h-4" />
            Insights
          </button>
        </div>
      </div>

      {/* Feed Tab */}
      {activeTab === 'feed' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 space-y-4"
        >
          <CommunityCreatePost />

          {posts.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900 rounded-2xl border border-dashed border-zinc-800">
              <Users className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">Seja o primeiro a postar!</p>
              <p className="text-sm text-zinc-600 mt-1">
                Compartilhe uma experiência, dica ou conquista
              </p>
            </div>
          ) : (
            posts.map((post, index) => (
              <CommunityPostCard
                key={post.id}
                post={post}
                delay={index * 0.05}
              />
            ))
          )}
        </motion.div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Category Grid */}
          <div className="px-6 mb-6">
            <div className="grid grid-cols-3 gap-3">
              {insightCategories.map((cat, index) => {
                const isActive = activeCategory === cat.id;
                return (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={cn(
                      "aspect-square rounded-2xl p-4 flex flex-col items-center justify-center gap-2 border transition-all duration-300",
                      isActive
                        ? `bg-gradient-to-br ${cat.color} border-blue-400/50`
                        : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                    )}
                  >
                    <cat.icon className={cn("w-8 h-8", isActive ? "text-emerald-400" : "text-zinc-400")} />
                    <span className={cn("text-xs text-center leading-tight", isActive ? "text-white" : "text-zinc-500")}>
                      {cat.label}
                    </span>
                  </motion.button>
                );
              })}
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                onClick={() => insightsQuery.refetch()}
                disabled={loadingInsights}
                className="aspect-square rounded-2xl p-4 flex flex-col items-center justify-center gap-2 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all"
              >
                <RefreshCw className={cn("w-8 h-8 text-zinc-400", loadingInsights && "animate-spin")} />
                <span className="text-xs text-zinc-500">Atualizar</span>
              </motion.button>
            </div>
          </div>

          {/* Insights List */}
          <div className="px-6">
            <h2 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">
              {activeCategory ? insightCategories.find(c => c.id === activeCategory)?.label : 'Todos os Insights'}
            </h2>

            {loadingInsights ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-4" />
                <p className="text-zinc-500">Gerando insights...</p>
              </div>
            ) : insightsFailure ? (
              <div className="text-center py-16">
                <p role="alert" className="text-sm text-red-400">
                  {insightsFailure.message}
                </p>
              </div>
            ) : insights.length === 0 ? (
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
                {insights.map((insight, index) => (
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
        </motion.div>
      )}
    </div>
  );
}