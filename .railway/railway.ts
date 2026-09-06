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
import { defineRailway, empty, postgres, preserve, project, service } from 'railway/iac';

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

export default defineRailway(() => {
  const database = postgres('postgres', { region: REGION });

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
    deploy: { region: REGION, restartPolicyType: 'ON_FAILURE' },
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
    },
  });

  return project('pai-presente', { resources: [database, api, web] });
});
