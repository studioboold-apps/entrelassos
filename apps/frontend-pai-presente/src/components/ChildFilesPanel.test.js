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

describe('o painel nasce vazio para cada filho', () => {
  /**
   * Mantido montado, o painel guardaria tipo, legenda e data do filho
   * anterior: arquivo do irmao errado legendado com a frase do irmao certo.
   */
  test('o painel so e montado com filho escolhido', () => {
    expect(DIALOG).toContain('{child !== null && <ChildFilesPanel child={child} />}');
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
