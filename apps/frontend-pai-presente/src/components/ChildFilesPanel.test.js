/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * O painel nao e' importado: puxa-lo traria React, o dialogo e o Radix. O que
 * se afirma aqui e' a LIGACAO — que subir arquivo encaminha decisao, falha e
 * recarga a quem ja tem regra e teste proprios.
 */
const PANEL = readFileSync(join(import.meta.dir, 'ChildFilesPanel.jsx'), 'utf8');
const HOOK = readFileSync(join(import.meta.dir, 'ChildFilesPanel.hook.js'), 'utf8');
const DIALOG = readFileSync(join(import.meta.dir, 'ChildFilesDialog.jsx'), 'utf8');
const EDIT_DIALOG = readFileSync(join(import.meta.dir, 'ChildEditDialog.jsx'), 'utf8');
const PERFIL_PAGE = readFileSync(join(import.meta.dir, '..', 'pages', 'Perfil.jsx'), 'utf8');
const USAGE = readFileSync(join(import.meta.dir, 'ChildFilesUsage.jsx'), 'utf8');
const USAGE_HOOK = readFileSync(join(import.meta.dir, 'ChildFilesUsage.hook.js'), 'utf8');

describe('o painel desenha, o hook decide (web.md §4)', () => {
  test('o painel nao chama a API', () => {
    expect(PANEL).not.toContain('api.');
  });

  test('o painel nao guarda estado a mao', () => {
    expect(PANEL).not.toContain('useState');
  });

  test('a decisao mora no hook do lado', () => {
    expect(PANEL).toContain('useChildFiles({ child })');
    expect(HOOK).toContain('useMutation');
  });
});

describe('a recusa do envio nao morre no log do navegador', () => {
  /**
   * Arquivo grande, tipo nao aceito e sessao vencida sao as tres recusas
   * esperadas aqui, e todas voltam com codigo. Sem aviso na tela, o pai clica
   * em "guardar", nada acontece, e ele nao tem como saber se o arquivo entrou.
   */
  test('nada vai para console.error', () => {
    expect(`${PANEL}\n${HOOK}`).not.toContain('console.error');
  });

  test('a falha vira frase pelo tradutor unico', () => {
    expect(HOOK).toContain('describeApiFailure');
  });

  test('as tres falhas aparecem como aviso', () => {
    expect(PANEL).toContain('role="alert"');
    expect(PANEL).toContain('uploadFailure');
    expect(PANEL).toContain('listFailure');
    expect(PANEL).toContain('removeFailure');
  });
});

describe('a lista se refaz sozinha depois de escrever', () => {
  /**
   * Subir e apagar sao escrita: sem invalidar, o arquivo recem-guardado nao
   * aparece e o apagado continua na tela — e a leitura de "nao funcionou" e' a
   * mesma nos dois casos.
   */
  test('subir e apagar invalidam a lista', () => {
    expect(HOOK).toContain('invalidateQueries');
    expect(HOOK).toContain('ChildFile.upload');
    expect(HOOK).toContain('ChildFile.delete');
  });

  test('o carregando sai da propria chamada', () => {
    expect(HOOK).not.toContain('setIsLoading');
  });
});

describe('trocar de tipo nao carrega arquivo do tipo anterior', () => {
  /**
   * Foto so' aceita imagem e exame aceita PDF tambem: o que servia para um
   * pode ser recusado pelo outro, e a recusa chegaria depois do envio, sem o
   * pai ligar uma coisa a outra.
   */
  test('escolher tipo limpa o arquivo', () => {
    expect(HOOK).toContain('function handleKindChange');
    expect(HOOK).toContain('setFile(null)');
  });

  test('o seletor de arquivo segue o tipo escolhido', () => {
    expect(PANEL).toContain('CHILD_FILE_ACCEPT[form.kind]');
  });
});

describe('o aviso vem antes do primeiro exame', () => {
  /**
   * Exame e' dado de saude de crianca — sensivel pela LGPD (art. 11), e a base
   * legal aqui e' o consentimento de quem tem a guarda. Consentimento que a
   * pessoa nao leu nao e' consentimento: o envio fica BARRADO ate' o aceite, e
   * a regra mora em `lib/exam-consent.js`, que tem teste proprio.
   */
  test('a regra sai do modulo unico, nao de um if na tela', () => {
    expect(HOOK).toContain('needsExamConsent');
    expect(HOOK).toContain('shouldShowExamNotice');
  });

  test('sem aceite, o botao de guardar nao envia', () => {
    expect(HOOK).toContain('!isExamConsentPending');
  });

  /**
   * Aceitar pelo Joao nao pode liberar o exame da Ana: a API grava
   * `unique(child_id, purpose)`, e a pergunta e' feita por filho.
   */
  test('o consentimento e perguntado por filho', () => {
    expect(HOOK).toContain('queryKey: [CHILD_CONSENTS_QUERY_KEY, childId]');
  });

  test('o texto do aviso sai do arquivo de traducao', () => {
    expect(PANEL).toContain("t('perfil.childFiles.examNotice.title')");
    expect(PANEL).toContain("t('perfil.childFiles.examNotice.body')");
    expect(PANEL).toContain("t('perfil.childFiles.examNotice.consent')");
  });

  /** Caixa sem rotulo ligado nao e' clicavel por teclado nem lida em voz alta. */
  test('a caixa de aceite tem rotulo ligado a ela', () => {
    expect(PANEL).toContain('id="exam-consent"');
    expect(PANEL).toContain('htmlFor="exam-consent"');
  });
});

describe('o painel nasce vazio para cada filho', () => {
  /**
   * Mantido montado, o painel guardaria tipo, legenda e data do filho
   * anterior: arquivo do irmao errado legendado com a frase do irmao certo.
   */
  test('o painel so e montado com filho escolhido', () => {
    expect(DIALOG).toContain('{child !== null && <ChildFilesPanel child={child} />}');
  });
});

describe('a linha do tempo junta atividade, foto e exame', () => {
  /**
   * Guardar foto e exame num painel separado das atividades daria DUAS
   * historias do mesmo filho, e nenhuma das duas responderia "o que aconteceu
   * em agosto". A juncao e' derivada na renderizacao, nao copiada para estado.
   */
  test('a juncao sai do modulo puro, com teste proprio', () => {
    expect(HOOK).toContain('buildChildTimeline');
  });

  test('as atividades vem pela chave que as outras telas ja aquecem', () => {
    expect(HOOK).toContain("const ACTIVITIES_QUERY_KEY = 'activities'");
    expect(HOOK).toContain('api.entities.Activity.list()');
  });

  /** Uma lista so' seria meia historia: quem falhar das duas tem de falar. */
  test('o carregando e a falha cobrem as duas listas', () => {
    expect(HOOK).toContain('filesQuery.isFetching || activitiesQuery.isFetching');
    expect(HOOK).toContain('filesQuery.error ?? activitiesQuery.error');
  });

  test('o painel entrega a linha do tempo a quem desenha', () => {
    expect(PANEL).toContain('<ChildTimeline entries={timeline} onRemoveFile={handleRemove} />');
  });

  /**
   * Duas copias da tabela de tipos concordam ate' a primeira edicao: o rotulo
   * mudaria no formulario e continuaria antigo na lista.
   */
  test('o tipo sai da fonte unica, nao de uma tabela do painel', () => {
    expect(PANEL).toContain('CHILD_FILE_KIND_OPTIONS');
    expect(PANEL).not.toContain('const KIND_OPTIONS');
  });
});

describe('o album tem porta de entrada na ficha do filho', () => {
  /**
   * Terceira ocorrencia do padrao que este projeto ja pagou: capacidade que
   * existe na API e nao tem botao na tela nao existe para o usuario.
   *
   * Desde o feedback do design (nov/2026) a porta fica DENTRO da ficha do
   * filho (editar), e nao mais como icone solto no cartao.
   */
  test('a ficha do filho abre o album', () => {
    expect(EDIT_DIALOG).toContain('handleOpenChildFiles(editingChild)');
    expect(PERFIL_PAGE).toContain('<ChildFilesDialog');
  });

  test('o botao diz o que abre', () => {
    expect(EDIT_DIALOG).toContain("t('perfil.childDialog.files'");
  });
});

describe('o aceite chega ao SERVIDOR, nao para no estado da tela', () => {
  /**
   * Medido em `child-file.use-case.ts`: `upload()` consulta
   * `childConsent.hasConsent({childId, userId, purpose})` ANTES do teto de
   * tamanho e antes do primeiro byte, e sem linha registrada lanca
   * `ChildExamConsentMissingError` (403). A caixa de aceite do `H5.3` mudava
   * `useState` e liberava o botao — o primeiro exame de cada filho batia no 403
   * e o pai lia "Confira: consent.".
   */
  test('aceitar concede o consentimento pela API', () => {
    expect(HOOK).toContain('api.entities.ChildConsent.grant');
  });

  test('a tela pergunta ao servidor quem ja consentiu', () => {
    expect(HOOK).toContain('api.entities.ChildConsent.list');
  });

  /** O palpite "ja tem exame guardado" saiu de cena: quem responde e' a lista de consentimentos. */
  test('o aceite nao mora mais em estado de tela', () => {
    expect(HOOK).not.toContain('hasAcceptedExamNotice');
    expect(HOOK).not.toContain('hasStoredExam');
  });

  /** Conceder e' escrita: a lista de consentimentos se refaz, senao o botao fica preso. */
  test('a concessao invalida a lista de consentimentos', () => {
    expect(HOOK).toContain('CHILD_CONSENTS_QUERY_KEY');
    expect(HOOK).toContain('CHILD_CONSENT_PURPOSES.HEALTH_DATA');
  });

  /** Enquanto a concessao viaja, a caixa nao pode aceitar duas vezes. */
  test('a caixa desabilita durante a concessao', () => {
    expect(PANEL).toContain('isGrantingConsent');
  });
});

describe('o teto aparece ANTES de o pai escolher a foto', () => {
  /**
   * Medido na API: o teto por arquivo sozinho nao limitava nada — mil arquivos
   * de 15 MiB passam um a um e somam 15 GiB, e o balde cobra por CONTA. Vieram
   * dois tetos novos (500 MiB por filho, 2 GiB por conta), e teto que so'
   * aparece na recusa e' o pior momento possivel: o pai escolhe o arquivo,
   * espera o envio e ai' descobre que nunca ia caber.
   */
  test('a medicao vem do servidor, nao de somar a pagina atual', () => {
    expect(USAGE_HOOK).toContain('api.entities.ChildFile.usage');
    expect(`${HOOK}\n${USAGE_HOOK}`).not.toContain('reduce((total');
  });

  /** Enviar e apagar mudam o quanto esta' em uso: a barra tem de refazer junto com a lista. */
  test('subir e apagar refazem a medicao, e nao so a lista', () => {
    expect(USAGE_HOOK).toContain("export const CHILD_FILES_USAGE_QUERY_KEY = 'childFilesUsage'");
    expect(USAGE_HOOK).toContain('queryKey: [CHILD_FILES_USAGE_QUERY_KEY, childId]');
    expect(HOOK).toContain('function refreshFiles');
    expect(HOOK).toContain('refreshUsage()');
  });

  /**
   * A conta de "cabe ou nao" mora em `lib/child-files.js`, com teste proprio: um
   * `if` na tela seria a terceira copia dos mesmos tres numeros, e copia
   * concorda com a API ate' a primeira edicao.
   */
  test('quem decide se cabe e o modulo unico, nao um if no painel', () => {
    expect(USAGE_HOOK).toContain('checkChildFileFit');
    expect(HOOK).toContain('CHILD_FILE_FIT.OK');
    expect(PANEL).not.toContain('fileMaxBytes');
  });

  test('o painel desenha a medicao, e nao a calcula', () => {
    expect(PANEL).toContain('<ChildFilesUsage usage={usage} fit={fit} childName={child.name} />');
    expect(PANEL).not.toContain('api.');
    expect(PANEL).not.toContain('useState');
  });

  /**
   * Barra sem valor lido em voz alta e' desenho: quem usa leitor de tela ouviria
   * "Album de Joao" e nenhum numero.
   */
  test('a barra diz o valor para o leitor de tela', () => {
    expect(USAGE).toContain('role="progressbar"');
    expect(USAGE).toContain('aria-valuenow');
    expect(USAGE).toContain('aria-valuemin');
    expect(USAGE).toContain('aria-valuemax');
  });

  test('o motivo de nao caber aparece como aviso', () => {
    expect(USAGE).toContain('role="alert"');
    expect(USAGE).toContain('CHILD_FILE_FIT.CHILD_QUOTA');
    expect(USAGE).toContain('CHILD_FILE_FIT.ACCOUNT_QUOTA');
  });

  test('o texto da medicao sai do arquivo de traducao', () => {
    expect(USAGE).toContain("t('perfil.childFiles.usage.child'");
    expect(USAGE).toContain("t('perfil.childFiles.usage.account'");
    expect(USAGE).toContain("t('perfil.childFiles.usage.fileMax'");
  });

  /** A barra amarela antes de encher: avisar no instante da recusa nao e' aviso. */
  test('a barra avisa antes de encher, e nao na recusa', () => {
    expect(USAGE).toContain('NEARLY_FULL_RATIO');
  });
});
