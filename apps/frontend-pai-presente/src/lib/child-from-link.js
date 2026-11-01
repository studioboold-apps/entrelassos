/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Nome do parametro que o avatar do topo poe na URL do Perfil. */
export const CHILD_LINK_PARAM = 'filho';

/**
 * O avatar do topo leva para `Perfil?filho=<id>`: a ficha daquele filho abre
 * direto, sem o pai procurar na lista. O parametro sai da URL ao abrir, entao
 * voltar, recarregar ou a lista chegar de novo NAO reabrem a ficha nem
 * reescrevem o que o pai estiver digitando.
 *
 * Mora fora do `Perfil.hook`, que tem a regra de nao reescrever formulario por
 * efeito: este efeito so' dispara com o parametro presente, uma vez.
 */
export function useChildFromLink({ children, onOpen }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const childId = searchParams.get(CHILD_LINK_PARAM);

  useEffect(() => {
    if (childId === null) return;
    const child = children.find((candidate) => candidate.id === childId);
    if (child === undefined) return;
    onOpen(child);
    setSearchParams({}, { replace: true });
    // `onOpen` muda a cada render; o gatilho e' so' o parametro e a lista.
  }, [childId, children]);
}
