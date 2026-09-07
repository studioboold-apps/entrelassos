/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { describeApiFailure } from '@/lib/api-error-message';
import { CHILD_FILE_FIT, CHILD_FILE_KINDS } from '@/lib/child-files';
import { buildChildTimeline } from '@/lib/child-timeline';
import {
  CHILD_CONSENT_PURPOSES,
  needsExamConsent,
  shouldShowExamNotice,
} from '@/lib/exam-consent';

import { useChildFileUsage } from './ChildFilesUsage.hook';

const CHILD_FILES_QUERY_KEY = 'childFiles';

/** Por filho, como os arquivos: consentir pelo Joao nao consente pela Ana. */
const CHILD_CONSENTS_QUERY_KEY = 'childConsents';

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

  /**
   * Quem responde se ha consentimento e' a API — a MESMA linha que `upload()`
   * consulta antes do primeiro byte. Guardar o aceite em estado de tela fazia a
   * caixa liberar o botao e a API recusar o envio com 403.
   */
  const consentsQuery = useQuery({
    queryKey: [CHILD_CONSENTS_QUERY_KEY, childId],
    queryFn: () => api.entities.ChildConsent.list(childId),
    enabled: childId !== undefined,
  });

  const { usage, fit, refreshUsage } = useChildFileUsage({ childId, file });

  /** Escrever muda a lista E a medicao: refazer so' uma deixaria a barra mentindo. */
  function refreshFiles() {
    queryClient.invalidateQueries({ queryKey: [CHILD_FILES_QUERY_KEY, childId] });
    refreshUsage();
  }

  const uploadMutation = useMutation({
    mutationFn: () => api.entities.ChildFile.upload({ childId, file, ...form }),
    onSuccess: () => {
      setForm(EMPTY_FORM);
      setFile(null);
      refreshFiles();
    },
  });

  /** Conceder e' escrita: sem refazer a lista, o botao ficaria preso ate' o dialogo fechar. */
  const grantConsentMutation = useMutation({
    mutationFn: () =>
      api.entities.ChildConsent.grant({
        childId,
        purpose: CHILD_CONSENT_PURPOSES.HEALTH_DATA,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHILD_CONSENTS_QUERY_KEY, childId] });
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

  /**
   * Sem caminho de volta pela caixa: retirar consentimento (art. 8 §5) apaga a
   * base legal de exames que JA estao guardados, e desmarcar uma caixa nao e'
   * lugar de decidir isso. A retirada tem rota propria na API e vai ganhar tela
   * com a lista do que sera afetado.
   */
  function handleAcceptExamNotice(isAccepted) {
    if (!isAccepted) return;
    grantConsentMutation.mutate();
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
  const files = filesQuery.data ?? [];
  const timeline = buildChildTimeline({
    activities: activitiesQuery.data ?? [],
    files,
    childId,
  });

  /** Vazia e "deu errado" sao coisas diferentes: qualquer uma das duas listas que recusar tem de falar. */
  const listError = filesQuery.error ?? activitiesQuery.error;

  const isExamConsentPending = needsExamConsent({
    kind: form.kind,
    consents: consentsQuery.data ?? [],
  });

  return {
    timeline,
    isLoadingTimeline: filesQuery.isFetching || activitiesQuery.isFetching,
    listFailure: listError ? describeApiFailure(listError) : null,
    consentFailure: grantConsentMutation.isError
      ? describeApiFailure(grantConsentMutation.error)
      : null,
    uploadFailure: uploadMutation.isError ? describeApiFailure(uploadMutation.error) : null,
    removeFailure: removeMutation.isError ? describeApiFailure(removeMutation.error) : null,
    form,
    fileName: file?.name ?? '',
    isUploading: uploadMutation.isPending,
    showsExamNotice: shouldShowExamNotice(form.kind),
    isExamConsentPending,
    isGrantingConsent: grantConsentMutation.isPending,
    usage,
    fit,
    /**
     * O botao morre quando o arquivo nao cabe. A API decide de verdade — mas
     * deixar clicar para recusar depois do envio gasta a espera do pai e a saida
     * de rede da conta pelo mesmo "nao".
     */
    canUpload:
      file !== null &&
      !uploadMutation.isPending &&
      !isExamConsentPending &&
      fit === CHILD_FILE_FIT.OK,
    handleKindChange,
    handleAcceptExamNotice,
    handleFieldChange,
    handleFileChange,
    handleUpload,
    handleRemove,
  };
}
