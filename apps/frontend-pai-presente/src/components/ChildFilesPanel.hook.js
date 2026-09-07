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

const CHILD_FILES_QUERY_KEY = 'childFiles';

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

  return {
    files: filesQuery.data ?? [],
    isLoadingFiles: filesQuery.isFetching,
    listFailure: filesQuery.isError ? describeApiFailure(filesQuery.error) : null,
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
