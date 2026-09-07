/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { checkChildFileFit } from '@/lib/child-files';

/** Separada da lista: a soma vem do servidor, e nao de contar `byteSize` das linhas da pagina atual. */
export const CHILD_FILES_USAGE_QUERY_KEY = 'childFilesUsage';

/**
 * O quanto ja' foi usado, e se o arquivo escolhido cabe. Sem isto o teto so'
 * aparece na RECUSA, que e' o pior momento possivel: o pai escolhe o arquivo,
 * espera o envio e ai' descobre que nunca ia caber.
 *
 * Quem compoe este hook e' o do PAINEL, e nao o componente que desenha a barra:
 * o `fit` tambem decide se o botao de guardar clica, e essa decisao e' do
 * formulario. O componente recebe os dois como propriedade e so' desenha.
 */
export function useChildFileUsage({ childId, file }) {
  const queryClient = useQueryClient();

  const usageQuery = useQuery({
    queryKey: [CHILD_FILES_USAGE_QUERY_KEY, childId],
    queryFn: () => api.entities.ChildFile.usage(childId),
    enabled: childId !== undefined,
  });

  /** Enviar e apagar mudam o quanto esta' em uso: a barra tem de refazer junto com a lista. */
  function refreshUsage() {
    queryClient.invalidateQueries({ queryKey: [CHILD_FILES_USAGE_QUERY_KEY, childId] });
  }

  const usage = usageQuery.data;

  return { usage, fit: checkChildFileFit({ file, usage }), refreshUsage };
}
