/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';

/**
 * Abertura do app: os dois elos da marca entram um de cada lado, se encaixam e
 * o coracao "bate" uma vez. Pedido do design (nov/2026) — uma animacao curta
 * do simbolo da mais cara de produto pronto do que um spinner generico.
 *
 * O simbolo e' desenhado em SVG (e nao o PNG da marca) para cada elo poder se
 * mover sozinho. O pedaco laranja repetido com recorte e' o que faz os elos
 * parecerem entrelacados: um passa por cima do outro em cada cruzamento.
 */
const LINK_SHAPE = { x: -120, y: -60, width: 240, height: 120, rx: 60 };
const CREAM = '#F3F0E8';
const ORANGE = '#F28800';

function Link({ color, transform }) {
  return <rect {...LINK_SHAPE} stroke={color} transform={transform} />;
}

export default function BrandSplash({ label = 'Carregando' }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-brand-navy"
    >
      <style>{`
        @keyframes splash-from-left { from { transform: translateX(-90px); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes splash-from-right { from { transform: translateX(90px); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes splash-beat { 0%, 100% { transform: scale(1) } 40% { transform: scale(1.1) } 70% { transform: scale(0.97) } }
        @keyframes splash-fade-up { from { transform: translateY(8px); opacity: 0 } to { transform: none; opacity: 1 } }
        .splash-left { animation: splash-from-left 520ms cubic-bezier(.2,.8,.2,1) both }
        .splash-right { animation: splash-from-right 520ms cubic-bezier(.2,.8,.2,1) both }
        .splash-beat { transform-origin: 256px 256px; animation: splash-beat 600ms ease-in-out 560ms both }
        .splash-word { animation: splash-fade-up 400ms ease-out 650ms both }
        @media (prefers-reduced-motion: reduce) {
          .splash-left, .splash-right, .splash-beat, .splash-word { animation: none }
        }
      `}</style>

      <svg viewBox="70 110 380 300" className="h-28 w-36" aria-hidden="true">
        <defs>
          <clipPath id="splash-crossing">
            <rect x="245" y="295" width="110" height="70" transform="rotate(-45 300 330)" />
          </clipPath>
        </defs>
        <g className="splash-beat" fill="none" strokeWidth="44">
          <g className="splash-right">
            <Link color={ORANGE} transform="translate(320 257) rotate(-45)" />
          </g>
          <g className="splash-left">
            <Link color={CREAM} transform="translate(204 256) rotate(45)" />
          </g>
          <g className="splash-right">
            {/* recorte num <g> sem rotacao: no <rect> ele giraria junto com o elo */}
            <g clipPath="url(#splash-crossing)">
              <Link color={ORANGE} transform="translate(320 257) rotate(-45)" />
            </g>
          </g>
        </g>
      </svg>

      <div className="splash-word text-center leading-none">
        <p className="text-3xl font-bold tracking-tight">
          <span style={{ color: CREAM }}>Entre</span>
          <span style={{ color: ORANGE }}>laços</span>
        </p>
        <p className="mt-1 text-xs font-bold tracking-[0.2em]" style={{ color: CREAM }}>
          PAI PRESENTE
        </p>
      </div>
    </div>
  );
}
