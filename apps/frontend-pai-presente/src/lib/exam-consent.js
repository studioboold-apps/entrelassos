/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { CHILD_FILE_KINDS } from '@/lib/child-files';

/**
 * Exame e' dado de saude de uma crianca — a categoria que a LGPD trata como
 * sensivel (art. 11). Guardar isso e' decisao do pai, e decisao que ninguem
 * toma sem ler: o aviso precede o PRIMEIRO exame e barra o envio ate' ser
 * aceito.
 *
 * A regra mora aqui, fora do componente, porque ela e' a fronteira do produto
 * com a lei: a tela pode mudar de forma, e o gatilho continua o mesmo.
 */
export function hasStoredExam(files) {
  return files.some((file) => file.kind === CHILD_FILE_KINDS.EXAM);
}

/** O texto aparece em todo exame; o consentimento so' e' cobrado no primeiro. */
export function shouldShowExamNotice(kind) {
  return kind === CHILD_FILE_KINDS.EXAM;
}

/** @param {{ kind?: string, files?: ReadonlyArray<{ kind: string }>, hasAccepted?: boolean }} [options] */
export function needsExamConsent({ kind, files = [], hasAccepted = false } = {}) {
  if (!shouldShowExamNotice(kind)) return false;
  if (hasAccepted) return false;
  return !hasStoredExam(files);
}
