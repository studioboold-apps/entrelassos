/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { describeApiFailure } from '@/lib/api-error-message';
import { CHILD_FILE_KINDS } from '@/lib/child-files';
import { buildChildTimeline } from '@/lib/child-timeline';

const CHILD_FILES_QUERY_KEY = 'childFiles';

/** A mesma chave das outras telas: a lista de atividades ja esta em cache quando o dialogo abre. */
const ACTIVITIES_QUERY_KEY = 'activities';

const EMPTY_FORM = Object.freeze({ kind: CHILD_FILE_KINDS.PHOTO, caption: '', takenOn: '' });

/**
 * A decisao mora aqui e o dialogo so' desenha (`web.md` §4). O hook fica ao lado
 * do componente, e nao em `lib/`, porque quem chama a API tem de estar dentro do
 * alcance da varredura de `client.test.js` — entidade que nenhuma tela consome
 * passa em todo teste de contrato e nao existe para o usuario.
 */
export function useChildFiles({ child }) {
  const queryClient = useQueryClient();
  const childId = child?.id;
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);

  const filesQuery = useQuery({
    queryKey: [CHILD_FILES_QUERY_KEY, childId],
    queryFn: () => api.entities.ChildFile.list(childId),
    enabled: childId !== undefined,
  });

  /**
   * A linha do tempo do filho mistura atividade, foto e exame; a atividade nao
   * tem rota por filho, e a lista da conta inteira ja e' a que as outras telas
   * puxam. Filtrar por filho e' do `buildChildTimeline`.
   */
  const activitiesQuery = useQuery({
    queryKey: [ACTIVITIES_QUERY_KEY],
    queryFn: () => api.entities.Activity.list(),
    enabled: childId !== undefined,
  });

  function refreshFiles() {
    queryClient.invalidateQueries({ queryKey: [CHILD_FILES_QUERY_KEY, childId] });
  }

  const uploadMutation = useMutation({
    mutationFn: () => api.entities.ChildFile.upload({ childId, file, ...form }),
    onSuccess: () => {
      setForm(EMPTY_FORM);
      setFile(null);
      refreshFiles();
    },
  });

  const removeMutation = useMutation({
    mutationFn: (fileId) => api.entities.ChildFile.delete({ childId, fileId }),
    onSuccess: refreshFiles,
  });

  /**
   * Trocar de tipo limpa o arquivo escolhido: foto so' aceita imagem e exame
   * aceita PDF tambem, entao o que servia para um pode ser recusado pelo outro —
   * e a recusa chegaria depois do envio, sem o pai ligar uma coisa a outra.
   */
  function handleKindChange(kind) {
    setForm((current) => ({ ...current, kind }));
    setFile(null);
  }

  function handleFieldChange(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleFileChange(event) {
    setFile(event.target.files?.[0] ?? null);
  }

  function handleUpload() {
    uploadMutation.mutate();
  }

  function handleRemove(fileId) {
    removeMutation.mutate(fileId);
  }

  /**
   * Derivada durante a renderizacao, nunca copiada para estado (`react.md`): a
   * copia divergiria da query na primeira gravacao, e o registro novo sumiria
   * da linha do tempo sem ninguem ligar uma coisa a outra.
   */
  const timeline = buildChildTimeline({
    activities: activitiesQuery.data ?? [],
    files: filesQuery.data ?? [],
    childId,
  });

  /** Vazia e "deu errado" sao coisas diferentes: qualquer uma das duas listas que recusar tem de falar. */
  const listError = filesQuery.error ?? activitiesQuery.error;

  return {
    timeline,
    isLoadingTimeline: filesQuery.isFetching || activitiesQuery.isFetching,
    listFailure: listError ? describeApiFailure(listError) : null,
    uploadFailure: uploadMutation.isError ? describeApiFailure(uploadMutation.error) : null,
    removeFailure: removeMutation.isError ? describeApiFailure(removeMutation.error) : null,
    form,
    fileName: file?.name ?? '',
    isUploading: uploadMutation.isPending,
    canUpload: file !== null && !uploadMutation.isPending,
    handleKindChange,
    handleFieldChange,
    handleFileChange,
    handleUpload,
    handleRemove,
  };
}
