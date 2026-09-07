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
const SECTION = readFileSync(join(import.meta.dir, 'PerfilChildrenSection.jsx'), 'utf8');

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

  /** Aceitar pelo Joao nao pode liberar o exame da Ana. */
  test('o aceite morre com o painel do filho', () => {
    expect(HOOK).toContain('const [hasAcceptedExamNotice, setHasAcceptedExamNotice] = useState(false)');
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
   */
  test('o cartao do filho abre o album', () => {
    expect(SECTION).toContain('setChildForFiles(child)');
    expect(SECTION).toContain('<ChildFilesDialog');
  });

  test('o botao de icone tem nome para o leitor de tela', () => {
    expect(SECTION).toContain("aria-label={t('perfil.childrenSection.files')}");
  });
});
