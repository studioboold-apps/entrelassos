import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/api/client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown,
  Award,
  Target,
  Loader2,
  Calendar,
  Star,
  Heart,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  HelpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { BRAND_LOGO } from '@/lib/brand';
import { toMonthKey } from '@/lib/month';
import { buildMonthStats } from '@/lib/boletim-stats';
import { describeApiFailure } from '@/lib/api-error-message';


const categoryLabels = {
  comportamento: 'Comportamento',
  sexualidade: 'Sexualidade',
  financeira: 'Financeira',
  saude: 'Saúde'
};

const activityCategoryLabels = {
  aventura: 'Aventura',
  educativa: 'Educativa',
  esportiva: 'Esportiva',
  criativa: 'Criativa',
  natureza: 'Natureza',
  culinaria: 'Culinária',
  jogos: 'Jogos',
  escolar: 'Escolar',
  cursos: 'Cursos',
  oficinas: 'Oficinas'
};

export default function Boletim() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => api.entities.Activity.list(),
  });

  const { data: insightRatings = [] } = useQuery({
    queryKey: ['insightRatings'],
    queryFn: () => api.entities.InsightRating.list(),
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.auth.me(),
  });

  /**
   * O recorte do mes tem UMA fonte, e ela tem teste. Aqui a tela refazia a conta
   * construindo uma data a partir da string do dia, o que a le como meia-noite
   * UTC: o dia 1 de todo mes caia para o mes anterior, e a nota da IA — que a API
   * calcula por dia de calendario — falava de um conjunto de atividades diferente
   * do que os cartoes mostravam.
   */
  const stats = buildMonthStats({ activities, ratings: insightRatings, month: currentMonth });
  const { monthActivities, monthRatings } = stats;
  const completedActivities = monthActivities.filter(a => a.completed);

  // Dados para gráfico radar por categoria de insight
  const insightsByCategory = Object.keys(categoryLabels).map(cat => {
    const catRatings = monthRatings.filter(r => r.category === cat);
    const avgRating = catRatings.length > 0
      ? catRatings.reduce((sum, r) => sum + r.rating, 0) / catRatings.length
      : 0;
    return {
      category: categoryLabels[cat],
      value: avgRating,
      fullMark: 5
    };
  });

  // Dados para gráfico de barras por categoria de atividade
  const activitiesByCategory = Object.keys(activityCategoryLabels).map(cat => {
    const catActivities = completedActivities.filter(a => a.category === cat);
    return {
      name: activityCategoryLabels[cat],
      quantidade: catActivities.length,
      color: catActivities.length > 0 ? '#10b981' : '#3b82f6'
    };
  }).filter(c => c.quantidade > 0);

  const reportMutation = useMutation({
    /**
     * As contas do boletim saem do SERVIDOR. Aqui elas so alimentam os graficos;
     * mandar `completionRate` pronto no prompt, como a Base44 fazia, deixava o
     * proprio cliente escolher a nota que ia receber.
     *
     * @param {string} month
     */
    mutationFn: (month) => api.ai.report(month),
  });

  const report = reportMutation.data;
  const loadingReport = reportMutation.isPending;

  /**
   * Sem chave, `POST /v1/report` responde 503 `AI_NOT_CONFIGURED`. A frase morria
   * escrita no log do navegador: o pai via o botao girar, voltar ao normal, e
   * nada acontecia — nenhuma palavra dizendo por que.
   */
  const reportFailure = reportMutation.isError ? describeApiFailure(reportMutation.error) : null;

  const generateReport = () => {
    reportMutation.mutate(toMonthKey(currentMonth));
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-emerald-400';
    if (score >= 6) return 'text-blue-400';
    if (score >= 4) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreLabel = (score) => {
    if (score >= 9) return 'Excelente';
    if (score >= 7) return 'Muito Bom';
    if (score >= 5) return 'Bom';
    if (score >= 3) return 'Regular';
    return 'Precisa Melhorar';
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* Header */}
      <div className="px-6 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <img src={BRAND_LOGO} alt="Entre Nós" className="w-12 h-12 rounded-xl" />
          <span className="text-blue-400 font-medium">Boletim</span>
        </div>
        <h1 className="text-2xl font-light text-white">
          Meu Desempenho
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Acompanhe sua evolução como pai
        </p>
      </div>

      {/* Month Selector */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-400" />
          </button>
          <div className="text-center">
            <h2 className="font-medium text-white capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <p className="text-xs text-zinc-500">
              {completedActivities.length} atividades realizadas
            </p>
          </div>
          <button
            onClick={() => setCurrentMonth(new Date())}
            disabled={format(currentMonth, 'MM/yyyy') === format(new Date(), 'MM/yyyy')}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-6 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800"
          >
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-zinc-500">Atividades</span>
            </div>
            <p className="text-2xl font-light text-white">
              {stats.completedActivities}/{stats.totalActivities}
            </p>
            <Progress value={stats.completionRate} className="mt-2 h-1.5" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800"
          >
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-zinc-500">Avaliação Média</span>
            </div>
            {/* Zero e' uma nota — a pior. Ninguem ter avaliado e' outra coisa. */}
            <p className="text-2xl font-light text-white">
              {stats.avgActivityRating === undefined ? (
                <span className="text-zinc-600">sem avaliação</span>
              ) : (
                <>
                  {stats.avgActivityRating}<span className="text-zinc-500 text-sm">/5</span>
                </>
              )}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800"
          >
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-zinc-500">Insights Lidos</span>
            </div>
            <p className="text-2xl font-light text-white">{stats.totalInsightsRead}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800"
          >
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-zinc-500">Taxa Conclusão</span>
            </div>
            <p className="text-2xl font-light text-white">{stats.completionRate}%</p>
          </motion.div>
        </div>
      </div>

      {/* Radar Chart - Insights by Category */}
      {insightsByCategory.some(c => c.value > 0) && (
        <div className="px-6 mb-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Engajamento por Área
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={insightsByCategory}>
                  <PolarGrid stroke="#3f3f46" />
                  <PolarAngleAxis 
                    dataKey="category" 
                    tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 5]} 
                    tick={{ fill: '#71717a', fontSize: 10 }}
                  />
                  <Radar
                    name="Avaliação"
                    dataKey="value"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bar Chart - Activities by Category */}
      {activitiesByCategory.length > 0 && (
        <div className="px-6 mb-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Atividades por Tipo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={activitiesByCategory} layout="vertical">
                  <XAxis type="number" tick={{ fill: '#71717a', fontSize: 10 }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fill: '#a1a1aa', fontSize: 11 }}
                    width={80}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      border: '1px solid #3f3f46',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="quantidade" radius={[0, 4, 4, 0]}>
                    {activitiesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Generate Report Button */}
      <div className="px-6 mb-6">
        <Button
          onClick={generateReport}
          disabled={loadingReport}
          className="w-full h-14 bg-gradient-to-r from-blue-500 to-emerald-400 hover:from-blue-600 hover:to-emerald-500 text-white font-medium"
        >
          {loadingReport ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Gerando Boletim...
            </>
          ) : (
            <>
              <Award className="w-5 h-5 mr-2" />
              Gerar Boletim do Mês
            </>
          )}
        </Button>

        {reportFailure && (
          <p role="alert" className="text-sm text-red-400 mt-2">
            {reportFailure.message}
          </p>
        )}
      </div>

      {/* Report Card */}
      {report && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 space-y-4"
        >
          {/* Score Card */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-emerald-500/10 border-blue-500/20">
            <CardContent className="pt-6 text-center">
              <p className="text-zinc-400 text-sm mb-2">Nota Geral</p>
              <p className={`text-6xl font-light ${getScoreColor(report.nota_geral)}`}>
                {report.nota_geral}
              </p>
              <p className={`text-lg mt-2 ${getScoreColor(report.nota_geral)}`}>
                {getScoreLabel(report.nota_geral)}
              </p>
            </CardContent>
          </Card>

          {/* Strengths */}
          <Card className="bg-zinc-900 border-emerald-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-emerald-400 text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Pontos Fortes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.pontos_fortes?.map((ponto, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-white text-sm">{ponto.titulo}</p>
                    <p className="text-zinc-400 text-sm">{ponto.descricao}</p>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Areas to Improve */}
          <Card className="bg-zinc-900 border-blue-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-blue-400 text-base flex items-center gap-2">
                <Target className="w-5 h-5" />
                Áreas para Desenvolver
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.pontos_melhoria?.map((ponto, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-white text-sm">{ponto.titulo}</p>
                    <p className="text-zinc-400 text-sm">{ponto.descricao}</p>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Motivational Message */}
          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-zinc-700">
            <CardContent className="pt-6">
              <p className="text-zinc-300 italic text-center leading-relaxed">
                "{report.mensagem_motivacional}"
              </p>
            </CardContent>
          </Card>

          {/* Next Month Goal */}
          <Card className="bg-zinc-900 border-emerald-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                Meta para o Próximo Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300">{report.meta_proximo_mes}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Empty State */}
      {!report && stats.totalActivities === 0 && stats.totalInsightsRead === 0 && (
        <div className="px-6">
          <div className="text-center py-12 bg-zinc-900 rounded-2xl border border-dashed border-zinc-800">
            <Award className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500">Sem dados neste mês</p>
            <p className="text-sm text-zinc-600 mt-1">
              Realize atividades e leia insights para gerar seu boletim
            </p>
          </div>
        </div>
      )}

      {/* Quick Access Section */}
      <div className="px-6 mt-8 mb-6">
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
    </div>
  );
}