/**
 * Pai Presente — infraestrutura
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import plan from './railway';

const graph = plan();

type Resource = {
  readonly address: string;
  readonly name?: string;
  readonly type: string;
  readonly config?: { readonly region?: string };
  readonly deploy?: {
    readonly region?: string;
    readonly multiRegionConfig?: Record<string, unknown>;
  };
  readonly volumeMounts?: Record<string, unknown>;
  readonly volumeAttachments?: Record<
    string,
    { readonly mountPath: string; readonly volumeConfig?: { readonly region?: string } }
  >;
};

const resources = graph.resources as readonly Resource[];

/**
 * A regiao mora em DOIS lugares no grafo: servico emite `deploy.region`, volume
 * emite `config.region`, e banco emite so a chave de `deploy.multiRegionConfig`.
 * Ler um lugar so faz o teste passar sem olhar metade dos recursos — que e'
 * pior que nao ter teste, porque o verde afirma o que ninguem verificou.
 */
function regiaoDe(resource: Resource): string | undefined {
  const declarada = resource.config?.region ?? resource.deploy?.region;
  if (declarada !== undefined) {
    return declarada;
  }

  const [porReplica] = Object.keys(resource.deploy?.multiRegionConfig ?? {});

  return porReplica;
}
const services = resources.filter((resource) => resource.type === 'service');
const volumes = resources.filter((resource) => resource.type === 'volume');
const databases = resources.filter((resource) => resource.type === 'database');

describe('disco e conteiner na MESMA regiao', () => {
  /**
   * Medido em 07/09/2026: o volume da midia nasceu em `sfo` e o servico da api
   * estava fixado em `us-east4-eqdc4a`. O Railway nao consegue montar volume de
   * outra regiao — o volume ficou `ERROR` com `currentSizeMB 0`, dois deploys
   * falharam, e no conteiner que ficou de pe `/data` era pasta do overlay:
   * gravavel, e apagada com o container. O `/health` respondeu 200 o tempo
   * todo, e por isso nada no deploy viu o defeito.
   *
   * Mover volume de regiao e' apagar e recriar, e o Railway cunha nome novo a
   * cada vez — foram tres nomes para o mesmo disco. Custa uma linha afirmar
   * aqui o que custou uma tarde medir la.
   */
  test('todo volume anexado esta na regiao do servico que o monta', () => {
    const conflitos = services.flatMap((servico) =>
      Object.entries(servico.volumeAttachments ?? {})
        .filter(([, anexo]) => anexo.volumeConfig?.region !== regiaoDe(servico))
        .map(
          ([nome, anexo]) =>
            `${nome} em ${anexo.volumeConfig?.region} para ${servico.address} em ${regiaoDe(servico)}`,
        ),
    );

    expect(conflitos).toEqual([]);
  });

  /** Consulta ao banco atravessando o pais custou ~65 ms por ida; na rede interna da mesma regiao, ~1-3 ms. */
  test('o banco fica na regiao de quem consulta', () => {
    const regioesDeServico = new Set(services.map(regiaoDe));

    for (const banco of databases) {
      expect(regioesDeServico.has(regiaoDe(banco))).toBe(true);
    }
  });
});

describe('o volume declarado vira ANEXO, nao sobra solto', () => {
  /**
   * `normalizeVolumeMounts` so emite anexo quando a CHAVE do registro e' o
   * caminho de montagem e o VALOR e' o no do volume. Com as duas trocadas o
   * grafo nao ve anexo nenhum, e `railway config plan` passa a propor DESANEXAR
   * o volume que a producao usa — sem erro, sem aviso.
   */
  test('nenhum volume fica em volumeMounts sem virar anexo', () => {
    for (const servico of services) {
      expect(Object.keys(servico.volumeMounts ?? {})).toEqual([]);
    }
  });

  test('todo volume declarado esta anexado a algum servico', () => {
    const anexados = new Set(
      services.flatMap((servico) => Object.keys(servico.volumeAttachments ?? {})),
    );

    for (const volumeDeclarado of volumes) {
      expect(anexados.has(volumeDeclarado.name ?? '')).toBe(true);
    }
  });
});
