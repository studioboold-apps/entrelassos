/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * A linha do tempo nao e' importada: puxa-la traria React e os icones. A ordem
 * e o agrupamento por dia ja tem teste proprio em `lib/child-timeline.test.js`;
 * o que se afirma aqui e' que ela DESENHA e nao decide.
 */
const TIMELINE = readFileSync(join(import.meta.dir, 'ChildTimeline.jsx'), 'utf8');

describe('a linha do tempo desenha, o hook decide (web.md §4)', () => {
  test('nao chama a API nem guarda estado a mao', () => {
    expect(TIMELINE).not.toContain('api.');
    expect(TIMELINE).not.toContain('useState');
  });

  /** Ordenar aqui daria uma segunda ordem, divergente da que o hook entregou. */
  test('nao reordena o que recebeu', () => {
    expect(TIMELINE).not.toContain('.sort(');
  });
});

describe('apagar so vale para arquivo', () => {
  /**
   * Atividade se apaga na tela dela, e o botao ao lado dela mandaria o id de
   * atividade para `ChildFile.delete` — que responderia 404 sem explicar nada.
   */
  test('o botao de apagar fica atras do tipo da entrada', () => {
    expect(TIMELINE).toContain('entry.entryKind === TIMELINE_ENTRY_KINDS.FILE');
    expect(TIMELINE).toContain('{isFile && (');
    expect(TIMELINE).toContain('onRemoveFile(entry.item.id)');
  });

  test('o botao de icone tem nome para o leitor de tela', () => {
    expect(TIMELINE).toContain("aria-label={t('perfil.childFiles.remove')}");
  });
});

describe('o dia nao anda para tras', () => {
  /**
   * `new Date('2026-09-05')` e' meia-noite UTC: a oeste de Greenwich o dia 5
   * aparece como 4, e a foto do aniversario cai na vespera.
   */
  test('o dia passa pelo leitor de data unico', () => {
    expect(TIMELINE).toContain('toLocalDate');
    expect(TIMELINE).not.toContain('new Date(');
  });

  test('sem data, a linha diz que nao tem — nao mostra vazio', () => {
    expect(TIMELINE).toContain("t('perfil.childFiles.noDate')");
  });
});

describe('nada de texto cravado na tag', () => {
  /** web.md §6: todo texto visivel sai de `*.locale.json`. */
  test('todo rotulo passa pelo tradutor', () => {
    expect(TIMELINE).toContain('useTranslation');
    expect(TIMELINE).toContain('t(kindOption.labelKey)');
    expect(TIMELINE).toContain("t('perfil.childFiles.kinds.activity')");
  });
});
