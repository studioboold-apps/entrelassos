/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Award, CheckCircle, Target, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { scoreColorClass, scoreLabelKey } from '@/lib/boletim-score';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

function ReportPoints({ points = [], icon: Icon, iconClass }) {
  return (
    <CardContent className="space-y-3">
      {points.map((point, index) => (
        <motion.div
          key={point.titulo}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex gap-3"
        >
          <Icon aria-hidden="true" className={cn('w-5 h-5 flex-shrink-0 mt-0.5', iconClass)} />
          <div>
            <p className="font-medium text-white text-sm">{point.titulo}</p>
            <p className="text-zinc-400 text-sm">{point.descricao}</p>
          </div>
        </motion.div>
      ))}
    </CardContent>
  );
}

/**
 * Fatia da tela de boletim: recebe o relatorio pronto que o servidor devolveu.
 *
 * @param {{ report: Record<string, unknown> }} props
 */
export default function BoletimReportCard({ report }) {
  const { t } = useTranslation();
  const scoreClass = scoreColorClass(report.nota_geral);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-6 space-y-4">
      <Card className="bg-gradient-to-br from-blue-500/10 to-emerald-500/10 border-blue-500/20">
        <CardContent className="pt-6 text-center">
          <p className="text-zinc-400 text-sm mb-2">{t('boletim.report.overallScore')}</p>
          <p className={cn('text-6xl font-light', scoreClass)}>{report.nota_geral}</p>
          <p className={cn('text-lg mt-2', scoreClass)}>{t(scoreLabelKey(report.nota_geral))}</p>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-emerald-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-emerald-400 text-base flex items-center gap-2">
            <TrendingUp aria-hidden="true" className="w-5 h-5" />
            {t('boletim.report.strengths')}
          </CardTitle>
        </CardHeader>
        <ReportPoints points={report.pontos_fortes} icon={CheckCircle} iconClass="text-emerald-400" />
      </Card>

      <Card className="bg-zinc-900 border-blue-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-blue-400 text-base flex items-center gap-2">
            <Target aria-hidden="true" className="w-5 h-5" />
            {t('boletim.report.improvements')}
          </CardTitle>
        </CardHeader>
        <ReportPoints points={report.pontos_melhoria} icon={AlertCircle} iconClass="text-blue-400" />
      </Card>

      <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-zinc-700">
        <CardContent className="pt-6">
          <p className="text-zinc-300 italic text-center leading-relaxed">"{report.mensagem_motivacional}"</p>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-emerald-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Award aria-hidden="true" className="w-5 h-5 text-emerald-400" />
            {t('boletim.report.nextGoal')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-300">{report.meta_proximo_mes}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
