/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { Construction } from 'lucide-react';

import { appEnvironment, environmentBannerLabel } from '@/lib/environment';

/**
 * Sem a faixa, uma aba de homologacao e uma de producao sao indistinguiveis — e
 * o erro que isso produz e' apagar dado de cliente achando que era de teste.
 */
export default function EnvironmentBanner() {
  const label = environmentBannerLabel(appEnvironment);

  if (!label) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-amber-400 px-4 py-1.5 text-center text-xs font-semibold text-zinc-950"
    >
      <Construction aria-hidden="true" className="h-4 w-4 shrink-0" />
      {label}
    </div>
  );
}
