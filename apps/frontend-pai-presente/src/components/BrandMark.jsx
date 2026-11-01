/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React, { useId } from 'react';

import { cn } from '@/lib/utils';

/**
 * O simbolo da marca (dois elos que formam um coracao) desenhado em SVG, para
 * cada elo poder se mover sozinho. O pedaco laranja repetido com recorte faz
 * os elos parecerem entrelacados: um passa por cima do outro em cada cruzamento.
 *
 * `motion`:
 * - `enter`: os elos entram um de cada lado, se encaixam e o coracao bate (abertura);
 * - `loop`:  os elos se afastam e voltam a se encaixar, sem parar (carregando);
 * - `none`:  parado.
 *
 * `--splash-elapsed` (negativo) continua a animacao de onde a abertura estatica
 * do `index.html` parou, quando o React assume a tela.
 */
const LINK_SHAPE = { x: -120, y: -60, width: 240, height: 120, rx: 60 };
export const BRAND_CREAM = '#F3F0E8';
export const BRAND_ORANGE = '#F28800';
export const BRAND_NAVY = '#2F2F51';

const ORANGE_LINK = 'translate(320 257) rotate(-45)';
const CREAM_LINK = 'translate(204 256) rotate(45)';

const MOTION_STYLES = `
  @keyframes brand-from-left { from { transform: translateX(-90px); opacity: 0 } to { transform: none; opacity: 1 } }
  @keyframes brand-from-right { from { transform: translateX(90px); opacity: 0 } to { transform: none; opacity: 1 } }
  @keyframes brand-beat { 0%, 100% { transform: scale(1) } 40% { transform: scale(1.1) } 70% { transform: scale(0.97) } }
  @keyframes brand-loop-left { 0%, 100% { transform: none } 45%, 55% { transform: translateX(-26px) } }
  @keyframes brand-loop-right { 0%, 100% { transform: none } 45%, 55% { transform: translateX(26px) } }
  .brand-enter .brand-left { animation: brand-from-left 520ms cubic-bezier(.2,.8,.2,1) var(--splash-elapsed, 0ms) both }
  .brand-enter .brand-right { animation: brand-from-right 520ms cubic-bezier(.2,.8,.2,1) var(--splash-elapsed, 0ms) both }
  .brand-enter .brand-heart { transform-origin: 262px 260px; animation: brand-beat 600ms ease-in-out calc(560ms + var(--splash-elapsed, 0ms)) both }
  .brand-loop .brand-left { animation: brand-loop-left 1400ms ease-in-out infinite }
  .brand-loop .brand-right { animation: brand-loop-right 1400ms ease-in-out infinite }
  @media (prefers-reduced-motion: reduce) {
    .brand-enter *, .brand-loop * { animation: none !important }
  }
`;

function Link({ color, transform }) {
  return <rect {...LINK_SHAPE} stroke={color} transform={transform} />;
}

export default function BrandMark({ motion = 'none', cream = BRAND_CREAM, className }) {
  const clipId = useId().replace(/:/g, '');

  return (
    <svg
      viewBox="70 110 380 300"
      aria-hidden="true"
      overflow="visible"
      className={cn('overflow-visible', motion === 'enter' && 'brand-enter', motion === 'loop' && 'brand-loop', className)}
    >
      {motion !== 'none' && <style>{MOTION_STYLES}</style>}
      <defs>
        <clipPath id={clipId}>
          <rect x="245" y="295" width="110" height="70" transform="rotate(-45 300 330)" />
        </clipPath>
      </defs>
      <g className="brand-heart" fill="none" strokeWidth="44">
        <g className="brand-right">
          <Link color={BRAND_ORANGE} transform={ORANGE_LINK} />
        </g>
        <g className="brand-left">
          <Link color={cream} transform={CREAM_LINK} />
        </g>
        <g className="brand-right">
          {/* recorte num <g> sem rotacao: no <rect> ele giraria junto com o elo */}
          <g clipPath={`url(#${clipId})`}>
            <Link color={BRAND_ORANGE} transform={ORANGE_LINK} />
          </g>
        </g>
      </g>
    </svg>
  );
}
