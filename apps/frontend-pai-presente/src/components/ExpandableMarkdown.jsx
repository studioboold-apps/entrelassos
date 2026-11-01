import React, { useLayoutEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Resposta longa do mentor cansa no celular: mostramos as primeiras ~5 linhas
 * (o resumo, que o prompt pede no começo) e um botão para abrir o resto.
 * O corte só aparece quando o texto de fato passa da altura.
 */
const COLLAPSED_MAX_HEIGHT_REM = 7.5;

export default function ExpandableMarkdown({ children, className = '', moreLabel, lessLabel }) {
  const contentRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    const remInPixels = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    setIsOverflowing(element.scrollHeight > COLLAPSED_MAX_HEIGHT_REM * remInPixels + 4);
  }, [children]);

  const isClamped = isOverflowing && !isExpanded;

  return (
    <div>
      <div
        ref={contentRef}
        className={`relative overflow-hidden ${isClamped ? '' : 'max-h-none'}`}
        style={isClamped ? { maxHeight: `${COLLAPSED_MAX_HEIGHT_REM}rem` } : undefined}
      >
        <ReactMarkdown className={`${className} [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1.5 [&_p]:my-1.5`}>{children}</ReactMarkdown>
        {isClamped && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-zinc-900 to-transparent"
          />
        )}
      </div>
      {isOverflowing && (
        <button
          type="button"
          onClick={() => setIsExpanded((value) => !value)}
          aria-expanded={isExpanded}
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
        >
          {isExpanded ? lessLabel : moreLabel}
          {isExpanded ? (
            <ChevronUp aria-hidden="true" className="h-4 w-4" />
          ) : (
            <ChevronDown aria-hidden="true" className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
}
