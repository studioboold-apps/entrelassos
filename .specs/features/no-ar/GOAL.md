# 🎯 Objetivo — Pai Presente no ar

**Um pai abre o navegador do celular, instala o app, entra com o Google,
cadastra o filho e usa — em produção, na nossa infraestrutura, com os dados
dele guardados de forma que a LGPD aceite.**

O objetivo anterior (`codigo-em-casa`) terminou: o código saiu da Base44, tem
backend próprio, 127 testes e um PWA de verdade. Este objetivo cobre a distância
entre **"o código está pronto"** e **"tem gente usando"** — que é maior do que
a contagem de testes sugere.

> 🤖 Modelo: `sonnet` para execução; as decisões `D6`–`D9` são 🧠 `opus`.

---

## 1. A medição que organiza este documento: o app nunca rodou

Feita hoje, 05/09/2026, nesta máquina, comando por comando:

| passo | resultado |
|---|---|
| `make up` | ✅ Postgres sobe **saudável** — o runtime de Docker que faltava já existe |
| `bun run db:migrate` | ❌ `ZodError: LLM_API_KEY` — **não dá para criar tabela sem chave de IA** |
| o mesmo, com chave falsa | ✅ 10 tabelas criadas |
| `bun src/main.ts` | ❌ `nenhum provedor de login configurado` — **a API não sobe sem client id do Google ou da Apple** |
| `curl localhost:3000` | responde outro projeto — a porta 3000 está ocupada nesta máquina |

**Nenhuma das sete telas jamais desenhou um dado vindo da nossa API.** Os 127
testes cobrem contrato, unidade e regra; nenhum deles abre o app. O risco não
é teórico: em outro projeto deste ecossistema, oito defeitos sérios apareceram
no dia em que um humano finalmente olhou a tela, e sete não tinham teste que os
pegasse.

Por isso a **Fase 1 deste objetivo é rodar**, e nada mais.

---

## 2. O que já está de pé — medido

| | estado |
|---|---|
| **API** | 9 módulos, 21 rotas `/v1`, sessão em cookie `HttpOnly`, refresh rotativo, teto de 30 chamadas de IA por hora/usuário |
| **Banco** | 10 tabelas Drizzle, migrations versionadas, aplicadas e revertidas em banco limpo |
| **Frontend** | 7 páginas, `@base44/sdk` extirpado, cliente HTTP nosso, PWA instalável |
| **Testes** | 127 passam, 0 falham, 19 arquivos |
| **Infra local** | `docker-compose.yml`, `envs/`, `Makefile` — `make up` provado hoje |
| **Segurança** | `docs/SECURITY.md` com 3 achados corrigidos e 2 abertos |

---

## 3. As seis frentes que faltam

Cada uma com a medição que a sustenta. Ordem é dependência, não preferência.

### F1 — Rodar de ponta a ponta (bloqueia todo o resto)

Três defeitos de **acoplamento de boot**, todos medidos em §1:

1. **A migration exige a chave de IA.** Criar tabela não tem nada a ver com
   gerar texto; hoje quem não tem a chave não tem banco. Um schema de ambiente
   único para o processo inteiro faz cada tarefa carregar as exigências de
   todas as outras.
2. **A API não sobe sem credencial de OAuth real.** Falhar fechado é correto em
   produção (`security.md` §2) e é exatamente o que trava o desenvolvimento
   hoje: não existe caminho para rodar sem uma conta no Google Cloud.
3. **A porta é fixa** e colide com outro projeto na mesma máquina.

Falta também **seed** (`code-standart.md` §5: pelos próprios use cases, nunca
`INSERT` bruto). Banco vazio não desenha tela: o `D2` decidiu começar do zero,
então o primeiro pai a abrir o app veria sete telas vazias e nenhuma prova de
que elas funcionam.

### F2 — As sete telas contra a API nova

`TB.8` trocou o encanamento e provou que **compila**; ninguém provou que
**funciona**. As telas herdadas somam 2.780 linhas e falam com 21 rotas que
mudaram de formato — nomes de campo inclusive (`date` → `activityDate`,
`completed` → `isCompleted`, e o cliente carrega uma tabela de apelidos para
disfarçar a diferença).

Uma task por tela, cada defeito virando **teste antes do conserto**.

### F3 — LGPD: o passivo e o direito do titular

Duas coisas, e a segunda ninguém tinha notado ainda:

| item | medição |
|---|---|
| **`TL.1`** — três campos sensíveis obrigatórios | `sexual_orientation` **não tem consumidor nenhum**; os outros dois só alimentam o prompt de IA — exatamente o uso que exige consentimento específico (art. 11) |
| **Não existe apagar a conta** | `/v1/me` só tem `GET` e `PATCH`. Sem `DELETE`, sem exportação: o art. 18 dá ao titular o direito de eliminação e de portabilidade, e o produto guarda dado de **criança** |

### F4 — Publicar

Não existe **nenhum** artefato de publicação: sem `Dockerfile`, sem `fly.toml`,
sem pipeline. `D5` escolheu "Fly.io **ou** Railway" e a escolha entre os dois
continua aberta (`D6`).

Junto vêm os itens que só existem em produção: HTTPS, cabeçalhos e CSP sem
`unsafe-inline` (`S-005` em `docs/SECURITY.md`), backup criptografado, e
observabilidade que não vaze PII.

### F5 — Entrada de verdade

`TB.6` implementou e testou o login; ninguém nunca entrou. Falta o que não é
código: projeto no Google Cloud, tela de consentimento, e — para a Apple — uma
conta paga de desenvolvedor. Isso é `D7`.

### F6 — A dívida dos padrões

Herdada da Base44, medida, e **deliberadamente a última**:

| dívida | tamanho |
|---|---|
| Texto fixo no JSX, zero i18n (`web.md` §6) | 47 trechos com acento direto na tag; nenhum `*.locale.json` |
| Página gorda sem hook (`web.md` §4, §200 linhas) | `Perfil` 540, `Boletim` 522, `Juntinhos` 466, `Onboarding` 423; **zero** arquivos `*.hook.js` |
| `tsc` | 215 erros de linha de base, todos ruído de `checkJs` sobre `forwardRef` do shadcn |
| Teste de tela | zero — `@testing-library/react` não é dependência |

`web.md` §14 é explícito: **não migrar tela que funciona** só para adotar
padrão. A dívida se paga onde a tela já vai ser mexida por outro motivo — ou
seja, dentro da F2 — e o que sobrar vira decisão consciente, não esquecimento.

---

## 4. As decisões que não são minhas

Nenhuma é técnica o bastante para eu tomar sozinho: todas custam dinheiro, prazo
ou risco jurídico. `TL.1` e `D6` já foram fechadas; `D7`, `D8` e `D9` seguem
abertas, e as duas primeiras é que travam a entrada e a IA no ar.

| # | decisão | recomendação |
|---|---|---|
| **`TL.1`** | os três campos sensíveis: remover, virar opcional com consentimento específico, ou manter com base legal registrada | **remover os três.** O primeiro sai de graça (ninguém lê); os outros dois melhoram o prompt de IA de um jeito que não paga o passivo de guardar religião e política de quem tem filho pequeno |
| **`D6`** | ~~Fly.io ou Railway, e qual domínio~~ **FECHADA: Railway** | recomendei Fly.io pela região em São Paulo; o dono escolheu Railway, que **não tem região sul-americana** — ficou em `us-east4`. Domínio: `web-production-1d6f.up.railway.app`, cunhado no deploy |
| **`D7`** | login: só Google no lançamento, ou Google + Apple | **só Google.** A Apple exige conta paga de desenvolvedor (US$ 99/ano) e revisão; o código já suporta os dois, então ligar a Apple depois é configuração, não obra |
| **`D8`** | provedor de IA em produção e quem paga a chave | o código é agnóstico por env (`D4`). Falta escolher e ter a chave — sem ela, quatro rotas respondem erro |

E uma consequência de `D2` que precisa ser dita em voz alta: **começar do zero
significa que os usuários do app original terão de se recadastrar.** O que fazer
com o app da Base44 depois da virada (desligar? deixar lendo?) continua sem dono
(`ADR-001.md` §7) — isso é `D9`.

---

## 5. O que este objetivo NÃO faz

- **Não reescreve o frontend** nos padrões do ecossistema (F6 explica).
- **Não migra dado** do app original: `D2` fechou isso.
- **Não inventa produto novo.** Nenhuma tela, campo ou funcionalidade que não
  exista hoje entra aqui. Ideia nova vira objetivo próprio.
- **Não publica na loja.** É PWA por decisão (`ADR-001.md` §6.1); app nativo é
  outro projeto.

---

## PRONTO

### Fase 1 — rodar
- [x] `P1.1` — a migration roda sem chave de IA (env por necessidade, não por processo)
- [x] `P1.2` — existe caminho de desenvolvimento sem credencial do Google, fechado em produção
- [x] `P1.3` — porta e recursos sem colisão com outro projeto na mesma máquina
- [x] `P1.4` — seed pelos use cases: um pai, dois filhos, atividades, posts e conversa
- [x] `P1.5` — `make dev` sobe tudo, e um teste de fumaça prova entrar → criar filho → listar

### Fase 2 — as telas
- [x] `P2.1` a `P2.7` — as sete telas exercitadas com dado real, defeito com teste antes do conserto

### Fase 3 — LGPD
- [x] `P3.1` — `TL.1` aplicado (depende da decisão)
- [x] `P3.2` — apagar a conta e exportar os dados (art. 18), com trilha de auditoria

### Fase 4 — publicar
- [x] `P4.1` — `Dockerfile` das duas apps, build reprodutível
- [x] `P4.2` — publicado no provedor de `D6`, migrations no deploy
      **No ar em `https://web-production-1d6f.up.railway.app`.** Medido em
      05/09/2026: `GET /` responde `200` com o HTML; `GET /v1/activities`
      responde `401 UNAUTHENTICATED` **no envelope da API**, que é o que prova
      o repasse pela rede privada; dentro do contêiner, `/health` responde
      `{"data":{"status":"ok","database":"ok"}}`; e o pre-deploy deixou 11
      tabelas no schema `public` — migration de dentro da imagem, nunca
      `drizzle-kit push`.
      Três deploys falharam antes, e nenhuma das mensagens apontava a causa:
      (1) o `Dockerfile` publicava o estágio de **backup**, porque `docker
      build` sem `--target` constrói o ÚLTIMO estágio — a mensagem falava de
      `meta/_journal.json`; (2) faltava a variável `PORT`, e sem ela o provedor
      sondou porta nenhuma por cinco minutos com o processo VIVO; (3) o
      `Bun.serve` ligava só em IPv4 numa rede privada IPv6. Os três viraram
      teste antes de virar conserto.
      A produção é declarada em `.railway/railway.ts` — `railway config plan`
      compara com o ambiente vivo antes de tocar em nada.
- [x] `P4.3` — HTTPS, cabeçalhos e CSP sem `unsafe-inline` (`S-005`)
      medido nas imagens: 6 de 6 cabeçalhos nas duas, `script-src 'self'` sem
      `unsafe-inline` nem `unsafe-eval`, e 308 para `https` atrás do proxy. A
      dívida do `style-src` está escrita em `docs/SECURITY.md`.
- [x] `P4.4` — backup criptografado e observabilidade sem PII
      as duas metades do aceite MEDIDAS. Restore provado por `make backup-proof`:
      envelope de 28 559 bytes, 0 ocorrências dos nomes semeados dentro do
      cifrado, e o banco descartável voltou com `dados` e `forma` idênticos aos
      da origem. A régua ingênua — sha do dump inteiro — reprova SEMPRE no
      Postgres 17, que abre cada dump com um `\restrict` sorteado; li "restore
      DIVERGIU" antes de descobrir que o errado era a medição. Varredura de PII
      por `make log-pii-audit`: 20 chamadas a uma API viva com 5 iscas
      plantadas, nenhum achado — com controle positivo (8 testes que exigem que
      o detector ache cada isca) e guarda que REPROVA se a linha de boot não
      chegou, porque captura vazia parece varredura limpa.

### Fase 5 — entrada
- [ ] `P5.1` — credenciais reais de `D7`, login provado por uma pessoa

### Fase 6 — dívida
- [x] `P6.1` — o que a Fase 2 tocou sai nos padrões; o resto vira lista datada
      **Medido em 05/09/2026:** `*.hook.js` 0 → 9; `*.locale.json` 0 → 13; textos
      cravados no JSX das páginas 47 → 0; páginas acima de 200 linhas 4 → 0 (a maior
      era 520, agora 181). O que não foi tocado está em `docs/DEBITO.md` com data e
      tamanho: 5 componentes, 21 textos. Suíte 384 → 419 passando, 0 falhando;
      `tsc` da API limpo; `typecheck` do front 182 → 175 erros.

---

## Invariantes

1. **O que for implementado precisa aparecer na tela.** Comportamento sem prova
   visual é comportamento não entregue — foi assim que oito defeitos passaram
   por 189 testes verdes em outro projeto deste ecossistema.
2. **Defeito vira TESTE antes de virar conserto.** Consertar por hipótese custou
   três rodadas lá; aqui já custou uma (o cache da API, `S-001`).
3. **Achado sem medição é impressão.** Todo item deste documento tem o comando
   que o comprova.
4. **Dado sensível não vai para log, nem para prompt sem consentimento.** Vale
   em dobro: o produto guarda dado de criança.
5. **Falhar fechado em produção, nunca em desenvolvimento.** A API que não sobe
   sem OAuth está certa em produção e errada na máquina de quem desenvolve; a
   solução é caminho de dev explícito, jamais afrouxar a produção.
6. **Não editar tela que funciona só para adotar padrão** (`web.md` §14).
