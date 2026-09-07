/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { CHILD_FILE_KINDS } from '@/lib/child-files';

/**
 * A MESMA palavra que `child-consent.constant.ts` grava no banco e valida numa
 * lista fechada. Sao dois repositorios sem pacote partilhado, entao a palavra
 * aparece duas vezes — e renomea-la aqui nao renomeia consentimento nenhum: ela
 * so' deixa de casar, e a concessao passa a voltar 400.
 */
export const CHILD_CONSENT_PURPOSES = Object.freeze({ HEALTH_DATA: 'dado_de_saude' });

/**
 * Exame e' dado de saude de uma crianca — a categoria que a LGPD trata como
 * sensivel (art. 11), e cujo tratamento exige consentimento ESPECIFICO de um
 * dos pais (art. 14 §1).
 *
 * Quem responde "este pai consentiu?" e' o SERVIDOR, nunca a tela: a API checa
 * a mesma linha antes do primeiro byte e recusa com 403 sem ela. Decidir aqui
 * por palpite — "este filho ja tem exame guardado" — produzia uma tela que
 * liberava o botao para um envio que a API ia recusar.
 *
 * A regra mora fora do componente porque ela e' a fronteira do produto com a
 * lei: a tela pode mudar de forma, e o gatilho continua o mesmo.
 */
export function hasHealthDataConsent(consents) {
  return consents.some((consent) => consent.purpose === CHILD_CONSENT_PURPOSES.HEALTH_DATA);
}

/** O texto aparece em todo exame; a caixa de aceite so' enquanto falta a linha. */
export function shouldShowExamNotice(kind) {
  return kind === CHILD_FILE_KINDS.EXAM;
}

/** @param {{ kind?: string, consents?: ReadonlyArray<{ purpose: string }> }} [options] */
export function needsExamConsent({ kind, consents = [] } = {}) {
  if (!shouldShowExamNotice(kind)) return false;
  return !hasHealthDataConsent(consents);
}
