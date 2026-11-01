/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';
import { CheckCircle, TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/lib/i18n';

const AXIS_TICK = { fill: '#a1a1aa', fontSize: 11 };
const RADIUS_TICK = { fill: '#71717a', fontSize: 10 };
const BAR_COLORS = ['#3b82f6', '#10b981'];

/**
 * Fatia da tela de boletim: recebe o retorno do hook, nao props soltas.
 *
 * @param {{ boletim: ReturnType<import('@/pages/Boletim.hook').useBoletim> }} props
 */
export default function BoletimCharts({ boletim }) {
  const { t } = useTranslation();
  const { insightsByCategory, activitiesByCategory, hasEngagementChart } = boletim;

  return (
    <>
      {hasEngagementChart && (
        <div className="px-6 mb-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-zinc-100 text-base flex items-center gap-2">
                <TrendingUp aria-hidden="true" className="w-5 h-5 text-blue-600" />
                {t('boletim.charts.engagement')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={insightsByCategory}>
                  <PolarGrid stroke="#3f3f46" />
                  <PolarAngleAxis dataKey="category" tick={AXIS_TICK} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} tick={RADIUS_TICK} />
                  <Radar
                    name={t('boletim.charts.ratingSeries')}
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

      {activitiesByCategory.length > 0 && (
        <div className="px-6 mb-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-zinc-100 text-base flex items-center gap-2">
                <CheckCircle aria-hidden="true" className="w-5 h-5 text-emerald-600" />
                {t('boletim.charts.activitiesByType')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={activitiesByCategory} layout="vertical">
                  <XAxis type="number" tick={RADIUS_TICK} />
                  <YAxis type="category" dataKey="name" tick={AXIS_TICK} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="quantidade" radius={[0, 4, 4, 0]}>
                    {activitiesByCategory.map((entry, index) => (
                      <Cell key={entry.name} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
