/**
 * Pai Presente — docs
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { formatByteCeiling } from '../apps/api-pai-presente/src/modules/ChildFile/child-file.constant.ts';
import {
  CHILD_FILE_ACCOUNT_QUOTA_BYTES,
  CHILD_FILE_CHILD_QUOTA_BYTES,
  CHILD_FILE_MAX_BYTES,
} from '../apps/api-pai-presente/src/modules/shared/shared.constant.ts';

/**
 * Relatorio de custo e' o documento que envelhece calado: ninguem percebe que o
 * numero ficou errado, porque ninguem executa um documento. Este teste amarra as
 * frases do relatorio ao CODIGO que elas descrevem — mudar o teto, o destino
 * padrao da midia ou a cifra do exame reprova aqui, e nao na fatura.
 */
const REPORT = readFileSync(join(import.meta.dir, 'CUSTO.md'), 'utf8');

const API_SOURCE = join(import.meta.dir, '..', 'apps', 'api-pai-presente', 'src');
const ENVIRONMENT = readFileSync(join(API_SOURCE, 'config', 'environment.ts'), 'utf8');
const ERROR_CODES = readFileSync(join(API_SOURCE, 'modules', 'shared', 'errors', 'codes.ts'), 'utf8');
const CHILD_FILE_CONSTANT = readFileSync(
  join(API_SOURCE, 'modules', 'ChildFile', 'child-file.constant.ts'),
  'utf8',
);

describe('o teto impresso e o teto que a API cobra', () => {
  /**
   * Os tres numeros sao importados, nao copiados: um `500 MB` digitado aqui
   * concordaria com o codigo so' ate' a primeira edicao do teto
   * (`code-standart.md` §16), e e' justamente a edicao que este teste existe
   * para pegar.
   */
  test('os tres tetos aparecem no relatorio na unidade que o pai le', () => {
    expect(REPORT).toContain(formatByteCeiling(CHILD_FILE_MAX_BYTES));
    expect(REPORT).toContain(formatByteCeiling(CHILD_FILE_CHILD_QUOTA_BYTES));
    expect(REPORT).toContain(formatByteCeiling(CHILD_FILE_ACCOUNT_QUOTA_BYTES));
  });

  /** O custo de volume da conta cheia sai do teto da conta: 2 GiB × US$ 0,15. */
  test('a conta de volume usa o teto da conta, e nao um numero solto', () => {
    const accountGibibytes = CHILD_FILE_ACCOUNT_QUOTA_BYTES / 1024 ** 3;
    expect(REPORT).toContain(`${accountGibibytes} GiB × US$ 0,15`);
  });
});

describe('o balde custa zero porque nao existe balde', () => {
  /**
   * A medicao de 07/09: `railway bucket list` responde "No buckets found", o
   * servico `api` nao tem volume, e nenhuma das 16 variaveis dele e' de midia.
   * Se alguem configurar balde de verdade e o padrao do codigo mudar, este
   * teste reprova — e o relatorio para de dizer que o custo e' zero por
   * ausencia.
   */
  test('o destino padrao da midia continua o sistema de arquivos', () => {
    expect(ENVIRONMENT).toContain('.default(MEDIA_DESTINATIONS.FILESYSTEM)');
    expect(REPORT).toContain('cai no padrão `filesystem`');
  });

  test('o balde continua vazio no codigo, e o relatorio diz isso', () => {
    expect(ENVIRONMENT).toContain("MEDIA_S3_BUCKET: z.string().default('')");
    expect(REPORT).toContain('não existe balde');
  });

  /** Custo de balde e' a linha que mais tenta virar estimativa. Ela e' zero, e medida. */
  test('o relatorio nao cobra por um balde que ninguem provisionou', () => {
    expect(REPORT).toContain('| Balde | não existe balde (§3) | **US$ 0,00** |');
  });
});

describe('o exame nao pode ser guardado em producao, e o relatorio conta', () => {
  test('a chave da cifra continua vazia por padrao', () => {
    expect(ENVIRONMENT).toContain("MEDIA_ENCRYPTION_KEY: z.string().default('')");
  });

  test('a recusa citada no relatorio e o codigo que a API devolve', () => {
    expect(ERROR_CODES).toContain("KEY_INVALID: 'MEDIA_KEY_INVALID'");
    expect(REPORT).toContain('503 `MEDIA_KEY_INVALID`');
  });
});

describe('quem paga a saida de rede depende do caminho de entrega', () => {
  /**
   * A distincao e' a conclusao mais importante do relatorio: com balde, mil
   * vistas de foto sao saida de rede DO BALDE; sem balde, tudo passa pelo `api`
   * e a fatura e' nossa. Os dois caminhos tem de continuar existindo no codigo.
   */
  test('os dois caminhos citados existem como constante', () => {
    expect(CHILD_FILE_CONSTANT).toContain("LINK: 'link'");
    expect(CHILD_FILE_CONSTANT).toContain("BYTES: 'bytes'");
    expect(REPORT).toContain('`LINK`');
    expect(REPORT).toContain('`BYTES`');
  });
});

describe('o relatorio diz de onde cada numero veio', () => {
  /** Data no titulo: medicao sem data e' opiniao com numero. */
  test('a medicao tem data', () => {
    expect(REPORT).toContain('medido em 07/09/2026');
  });

  /** Os quatro precos da tabela da Railway, lidos em 07/09. */
  test('os precos da Railway estao escritos, nao lembrados', () => {
    expect(REPORT).toContain('US$ 10 / GB / mês');
    expect(REPORT).toContain('US$ 20 / vCPU / mês');
    expect(REPORT).toContain('US$ 0,05 / GB');
    expect(REPORT).toContain('US$ 0,15 / GB / mês');
  });

  /** Cada medicao carrega o comando que a produziu, para poder ser refeita. */
  test('os comandos que mediram estao no texto', () => {
    expect(REPORT).toContain('railway metrics --all --since 7d');
    expect(REPORT).toContain('railway bucket list');
    expect(REPORT).toContain('railway volume list');
  });

  /** O que nao foi medido e' secao propria: numero plausivel no lugar de medicao e' o defeito. */
  test('o que nao foi medido esta declarado', () => {
    expect(REPORT).toContain('## 4. O que não foi medido');
  });
});
