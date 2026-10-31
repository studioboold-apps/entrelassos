/**
 * Pai Presente — infraestrutura
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 *
 * A producao declarada em codigo, e nao clicada no painel.
 *
 * `railway config plan` compara ESTE arquivo com o ambiente vivo e mostra a
 * diferenca antes de tocar em nada. Painel clicado nao tem diferenca para
 * mostrar, nao entra em revisao e nao se refaz num ambiente novo — foi a mesma
 * razao que tirou o `drizzle-kit push` do caminho do deploy (`database.md`).
 *
 * Nenhum SEGREDO mora aqui (`security.md` §4). `AUTH_JWT_SECRET` nasce do
 * gerador do proprio Railway: ninguem digita, ninguem ve, e nao ha o que vazar
 * em terminal. `LLM_API_KEY` fica `preserve()` — o valor vive no provedor, e
 * este arquivo so afirma que a variavel existe.
 */
import { defineRailway, empty, postgres, preserve, project, service, volume } from 'railway/iac';

/**
 * Medido em 05/09/2026 (`railway api '{ regions { name country } }'`): o Railway
 * NAO tem regiao na America do Sul — Holanda, EUA, Singapura e mais nada. O
 * argumento a favor do Fly.io era exatamente `gru`, e ele nao sobreviveu a
 * escolha do provedor. US East e' o mais perto do Brasil que existe aqui.
 */
const REGION = 'us-east4-eqdc4a';

const API_PORT = 3000;
const WEB_PORT = 8080;

/**
 * Cunhado por `railway domain --service web --port 8080` em 05/09/2026. Fica em
 * constante porque e' o endereco que a documentacao, o `redirect_uri` do Google
 * (`D7`) e o teste de fumaca precisam citar pelo mesmo nome.
 */
const WEB_DOMAIN = 'web-production-1d6f.up.railway.app';

/**
 * A midia do historico (foto e exame) mora em DISCO, e o disco do container
 * morre com ele. Medido em 07/09/2026: sem volume, `MEDIA_DIRECTORY` valia o
 * padrao relativo `.media`, a API tentava `mkdir '/app/.media'` — pasta da
 * imagem, sem escrita para `bun` — e a subida respondia erro.
 *
 * O nome e' o que o Railway cunhou quando o volume foi criado. Ele fica aqui
 * porque volume clicado no painel nao se refaz num ambiente novo, e este
 * arquivo e' o que descreve a producao.
 *
 * O sufixo feio NAO e' enfeite, e nem foi escolhido: mover volume de regiao e'
 * APAGAR E RECRIAR (`volumeInstanceUpdate` aceita so `mountPath`, `serviceId` e
 * `state`; regiao so entra em `volumeCreate`), `volumeCreate` NAO aceita nome —
 * o Railway cunha —, e o volume apagado SEGURA o nome por dois dias de
 * carencia. Foi o que aconteceu em 07/09/2026: `api-volume` -> `api-volume-cs8b`
 * -> `api-volume-_R9v`, tres nomes para o mesmo disco, porque a regiao errada
 * so se conserta recriando. Entre esperar a carencia para ganhar um nome bonito
 * e declarar o nome que a producao tem hoje, este arquivo declara o que existe:
 * ele vale por descrever a verdade, nao por ser agradavel de ler.
 */
const MEDIA_VOLUME = 'api-volume-_R9v';
const MEDIA_MOUNT_PATH = '/data';

/**
 * Medido em 07/09/2026 (`volumeInstances { region sizeMB }`): o volume do
 * postgres nasceu em `us-east4-eqdc4a`, o da midia em `sfo` — costa oposta do
 * banco e da API. Nenhuma escolha: `railway volume add` NAO tem `--region`, e o
 * padrao dele ignora a regiao do projeto. Declarar aqui e' o unico caminho que
 * coloca o disco da foto ao lado de quem a le, e o tamanho entra junto porque
 * omiti-lo pede ao plano para zerar os 5 GB que o volume ja tem.
 */
const MEDIA_VOLUME_SIZE_MB = 5000;

export default defineRailway(() => {
  const database = postgres('postgres', { region: REGION });
  const media = volume(MEDIA_VOLUME, { region: REGION, sizeMB: MEDIA_VOLUME_SIZE_MB });

  /**
   * `empty()`: a imagem sobe por `railway up` a partir da RAIZ do monorepo, que
   * e' o contexto que os dois Dockerfiles esperam. Ligar ao GitHub e' melhor, e
   * e' o proximo passo — depende de o repositorio ter remoto, e hoje ele nao tem.
   */
  const api = service('api', {
    source: empty(),
    build: { builder: 'DOCKERFILE', dockerfilePath: 'apps/api-pai-presente/Dockerfile' },
    /**
     * A migration roda ANTES de a versao nova receber trafego, e o deploy para
     * se ela falhar. Nunca `drizzle-kit push` (`database.md`): empurrar schema
     * nao deixa migration revisavel e nao tem volta escrita.
     */
    preDeploy: 'bun dist/database/migrate.js',
    /**
     * `/health` pergunta ao banco e devolve 503 se ele nao responde. A saude
     * fixa mentia: na primeira fumaca o conteiner respondeu `ok` com o banco
     * inalcancavel — e e' este endereco que decide se o deploy e' promovido.
     */
    healthcheck: '/health',
    /**
     * A regiao aqui nao e' preferencia, e' pre-requisito do volume: disco e
     * conteiner tem de estar na MESMA regiao, ou o Railway nao consegue montar.
     * Medido em 07/09/2026 no `meta` do deploy que falhou duas vezes:
     * `deploy.region: null` com `multiRegionConfig: { sfo: { numReplicas: 1 } }`
     * enquanto o volume novo estava em `us-east4-eqdc4a` — o volume ficou
     * `ERROR`, `currentSizeMB 0`, e `mount | grep /data` no conteiner nao
     * achava nada: `/data` era pasta do overlay, gravavel e efemera. O
     * `/health` respondia 200 o tempo todo, que e' o que torna esta falha
     * perigosa — ela nao aparece em nada que o deploy verifica.
     *
     * Quem conserta o conflito e' o VOLUME, nao o servico. `serviceInstanceUpdate`
     * respondeu `true` duas vezes sem mover o conteiner (o `meta` do deploy
     * seguinte continuava `{ sfo: ... }`), e o Railway resolveu por conta dele
     * puxando o volume para `sfo` — o que remonta o disco e devolve o pulo de
     * costa a costa ate o banco (~65 ms por consulta medidos em 06/09 contra
     * ~1-3 ms na rede interna da mesma regiao). O caminho que funcionou foi
     * apagar o volume e recria-lo com `region` no leste, ao lado do banco.
     */
    deploy: { region: REGION, restartPolicyType: 'ON_FAILURE' },
    /**
     * O volume nasce com dono root, e a API roda como `bun`. Quem ajusta o dono
     * e' o entrypoint da imagem, que sobe como root e cai para `bun` — ver
     * `apps/api-pai-presente/docker-entrypoint.sh`. Montar o volume sem isso
     * troca "sem lugar para gravar" por "sem permissao para gravar".
     *
     * A CHAVE e' o ponto de montagem e o VALOR e' o volume, nunca o contrario:
     * so essa forma vira `volumeAttachments` (`normalizeVolumeMounts`). Escrito
     * ao contrario, o plano compilou sem erro e propos DESLIGAR o volume
     * (`volumeAttachments.api-volume.mountPath ("/data" -> null)`) — a midia
     * voltaria para o disco que morre com o conteiner.
     */
    volumeMounts: { [MEDIA_MOUNT_PATH]: media },
    env: {
      DATABASE_URL: database.env.DATABASE_URL,
      API_PORT: String(API_PORT),
  /**
   * `PORT` existe para o PROVEDOR, nao para a app: e' por ele que o Railway sabe
   * em que porta bater a checagem de saude e para onde mandar o trafego do
   * dominio. Medido em 05/09/2026: sem ele, o container subia, escrevia `api no
   * ar`, e a checagem falhava dez vezes seguidas com "service unavailable" ate o
   * deploy ser descartado com o processo VIVO — e nenhuma mensagem falava de
   * porta. Vem da mesma constante que a app usa; duas fontes divergiriam na
   * primeira edicao.
   */
      PORT: String(API_PORT),
      /** Gerado pelo Railway, 48 caracteres. O minimo do schema e' 32. */
      AUTH_JWT_SECRET: { generator: 'secret(48)' },
      LLM_PROVIDER: 'anthropic',
      LLM_API_KEY: preserve(),
      /**
       * A porta que NAO depende de terceiro. Ela ja e' o padrao do schema; esta
       * declarada assim mesmo porque quem le o plano precisa ver COMO se entra
       * no ambiente sem olhar o codigo da app.
       */
      AUTH_PASSWORD_SIGN_IN: '1',
      /**
       * `D7` ainda aberta: nao existe client_id do Google, e VAZIO e' a unica
       * forma honesta de dizer isso. Ate 06/09 havia aqui um marcador
       * (`AGUARDANDO-D7`) so para o boot fail-closed (`security.md` §2) achar
       * ALGUM provedor — e o preco era o login recusar todo mundo, com a tela
       * publicada sem nenhum jeito de entrar.
       *
       * Agora a senha e' a porta, e ela conta como porta na checagem de boot
       * (`verifier-registry.test.ts`). O dia em que `D7` chegar, o unico passo e'
       * trocar esta linha pelo client_id de verdade — nada mais muda.
       */
      GOOGLE_CLIENT_ID: '',
      /**
       * Dentro do volume, e nao na raiz dele: `lost+found` do ext4 vive em
       * `/data`, e pasta de midia com dono proprio e' o que o entrypoint
       * consegue ajustar sem tocar no que o sistema de arquivos reserva.
       */
      MEDIA_DIRECTORY: `${MEDIA_MOUNT_PATH}/media`,
      /**
       * A chave do exame (`security.md` §5: dado sensivel em repouso). Fica
       * `preserve()` pelo mesmo motivo da chave da IA — o valor vive no
       * provedor, e este arquivo so afirma que a variavel existe. Ela entrou
       * por `railway variable set --stdin`, que nao deixa o valor em linha de
       * comando, em transcricao nem em lista de processo.
       */
      MEDIA_ENCRYPTION_KEY: preserve(),
    },
  });

  const web = service('web', {
    source: empty(),
    build: { builder: 'DOCKERFILE', dockerfilePath: 'apps/frontend-pai-presente/Dockerfile' },
    healthcheck: '/health',
    /**
     * O endereco publico do pai. Ele e' UNICO na plataforma inteira, entao nao
     * da' para inventa-lo num ambiente novo: quem cria e' `railway domain`, e
     * declarar aqui o que ja existe e' o que faz o `plan` parar de acusar
     * diferenca. A porta 8080 nao e' decoracao — sem ela o dominio aponta para
     * porta nenhuma e o navegador recebe "application failed to respond".
     */
    networking: { serviceDomains: { [WEB_DOMAIN]: { port: WEB_PORT } } },
    deploy: { region: REGION, restartPolicyType: 'ON_FAILURE' },
    env: {
      /**
       * Rede PRIVADA: a API nao tem endereco publico. O cookie de sessao sai
       * host-only, e tela num host com API em outro faria o navegador guardar o
       * cookie e nao devolve-lo — o pai entraria, a tela recarregaria deslogada,
       * e nao apareceria erro nenhum. Por isso a web repassa `/v1`.
       */
      API_ORIGIN: 'http://${{api.RAILWAY_PRIVATE_DOMAIN}}:' + String(API_PORT),
      WEB_PORT: String(WEB_PORT),
      /** O mesmo que na API: e' o que o provedor prova e para onde o dominio aponta. */
      PORT: String(WEB_PORT),
      /** O Vite ASSA no bundle (`web.md` §12): tem de existir no BUILD. */
      APP_ENV: 'production',
      /**
       * Vazio ESCONDE o botao do Google; qualquer valor manda a tela tentar
       * desenha-lo. O marcador que ficava aqui era truthy: o SDK do Google era
       * baixado, recusava o client_id invalido, e a tela ficava com um buraco
       * onde devia haver botao — pior que nao ter botao nenhum, porque parece
       * carregamento pela metade.
       */
      GOOGLE_CLIENT_ID: '',
      /**
       * Anuncio (AdSense). `ADS_ENABLED` e' o interruptor geral: sem `1`, nada
       * liga — nenhum bloco na tela, CSP fechada como antes e `/ads.txt` em
       * 404 —, mesmo com os ids preenchidos. Assim os ids entram primeiro, se
       * valida em homologacao, e so depois se liga aqui.
       *
       * Nenhum id e' segredo — sai no HTML de todo site com anuncio. O servidor
       * le no BOOT (CSP e `ads.txt`) e o Vite grava no BUILD (o bloco na tela):
       * mudar qualquer um pede deploy novo, nao so restart.
       */
      ADS_ENABLED: '0',
      ADSENSE_CLIENT_ID: '',
      ADSENSE_SLOT_ID: '',
    },
  });

  return project('pai-presente', { resources: [database, media, api, web] });
});
