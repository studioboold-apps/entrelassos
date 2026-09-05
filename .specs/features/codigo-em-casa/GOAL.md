# 🎯 Objetivo — código em casa (Pai Presente)

**Trazer o app "Pai Presente" da Base44 para a máquina, entender o que ele é, e
decidir com dado na mão o que fazer com ele.**

A primeira metade está feita: o código está aqui e foi lido. A segunda metade é
uma decisão do usuário, e este documento existe para que ela seja tomada com os
números medidos em vez de impressão.

> 🤖 Modelo: `sonnet` para execução; a decisão de rumo (`D1`) é 🧠 `opus`.

---

## 1. O que é o produto

Descrição do próprio app, recuperada da API da Base44 (não é resumo meu):

> O aplicativo "Pai Presente" é um companheiro digital para pais que desejam
> criar filhos com propósito e forte preparo psicológico. Oferece insights
> diários sobre educação comportamental, sexualidade, educação financeira
> infantil e atividades para um estilo de vida saudável. Inclui um chat para
> dúvidas e um calendário "Juntinhos" com sugestões de atividades sazonais e
> avaliações para fortalecer a comunicação e o vínculo entre pais e filhos.

---

## 2. ⚠️ São DOIS apps, não um

Isto é a coisa mais importante do documento, e é fácil de esquecer daqui a uma
semana.

| | app id | o que é |
|---|---|---|
| **Original** | `69693b3d8c5d3c2fd0c67ca4` | o que está no ar, com os dados reais. **Intocado.** |
| **Local** | `6a9b4b26e3c9897ebba7d7d0` | criado pelo `base44 eject`, ligado a esta pasta |

`base44 eject` **não baixa o app; ele clona o código e cria um backend novo.**
O que veio: o código-fonte e o **schema** das 7 entidades. O que **não** veio:
**nenhum registro do banco**. O backend local nasceu vazio.

Consequência prática: rodar `npm run dev` aqui abre o app sem nenhum usuário,
filho, atividade ou post. Não é bug — é o que "eject" quer dizer.

Conta dona do app original: `fabricio.tr@gmail.com` (não é a conta de trabalho —
duas tentativas de login com outras contas deram `403 user_not_registered`).

---

## 3. O que veio — medido

99 arquivos fora de `node_modules`, `dist` e `.git`; 78 deles em `src/`.

| extensão | quantidade |
|---|---|
| `.jsx` | 71 |
| `.jsonc` | 9 (config + 7 entidades + app) |
| `.js` | 9 |
| `.json` | 4 |
| `.ts` / `.md` / `.html` / `.css` | 1 cada |

**Stack:** React 18 · Vite 6 · Tailwind 3.4 · shadcn/Radix · TanStack Query 5.84 ·
react-router-dom 6.26 · framer-motion · recharts · react-leaflet · three · jspdf ·
html2canvas · Stripe · zod · react-hook-form · `@base44/sdk ^0.8.46`.

O build roda: `dist/` foi gerado pelo próprio eject.

### As 7 entidades

| entidade | campos obrigatórios | observação |
|---|---|---|
| `Child` | `name`, `age`, `gender` | gostos: hobby, cor, comida, gênero de filme |
| `Activity` | `title`, `date` | 10 categorias; `rating` 1–5 e `feedback` |
| `User` | `age`, `sexual_orientation`, `religious_orientation`, `political_orientation` | ⚠️ ver §4.3 |
| `CommunityPost` | `content`, `author_name`, `category` | `likes_count`, `liked_by[]` |
| `CommunityComment` | `post_id`, `content`, `author_name` | |
| `InsightRating` | `insight_id`, `category`, `rating` | 4 categorias de insight |
| `ChatMessage` | `conversation_id`, `role`, `content` | ⚠️ ver §4.2 |

### As 8 páginas e o que cada uma usa

| página | tamanho | entidades |
|---|---|---|
| `Onboarding` (inicial) | 16.8K | `Child.create` |
| `Home` | 10.8K | `Child.list`, `InsightRating.create/list` |
| `Juntinhos` | 18.0K | `Activity.create/list/update`, `Child.list` |
| `Boletim` | 21.0K | `Activity.list`, `Child.list`, `InsightRating.list` |
| `Perfil` | 21.7K | `Child.create/delete/list/update`, `Activity.list`, `InsightRating.list` |
| `Chat` | 8.5K | `Child.list` + `InvokeLLM` |
| `Comunidade` | 11.4K | `CommunityPost.*`, `InsightRating.*` — ⚠️ ver §4.1 |
| `OAuthConsent` | 9.7K | nenhuma |

A IA entra por `base44.integrations.Core.InvokeLLM` (5 chamadas).

---

## 4. Os quatro achados

Encontrados lendo o código, **não corrigidos** — a instrução foi não editar nada.
Cada um vira uma decisão em §5.

### 4.1 A aba "Comunid." leva a lugar nenhum

`src/Layout.jsx` põe `Comunidade` na barra inferior. `src/pages.config.js` **não
registra** a página (`grep -c Comunidade pages.config.js` → `0`). Quem toca na
aba cai no `PageNotFound`.

`Comunidade.jsx` tem 11.4K e está inteira escrita. É código morto por uma linha
faltando no registro de rotas.

### 4.2 O chat não guarda conversa

Existe a entidade `ChatMessage` com `conversation_id`, `role` e `content` — e
**nenhuma página lê ou escreve nela**. `Chat.jsx` chama só `Child.list` e
`InvokeLLM`. Ou seja: fecha o app, perde a conversa.

### 4.3 ⚠️ LGPD — dado sensível como campo obrigatório

A entidade `User` exige **orientação sexual, religiosa e política**. Os três são
**dado pessoal sensível** pelo art. 5º, II da LGPD, e o app os coleta como
obrigatórios no onboarding — antes de o usuário ver qualquer valor entregue.

Isto não é detalhe de implementação: é a exposição jurídica mais cara deste
produto, e é a única coisa aqui que piora com o tempo (cada cadastro novo
aumenta o passivo).

### 4.4 O código local não é a fonte da verdade

Editar arquivos aqui **não muda o app que está no ar**. São backends diferentes
(§2). Publicar daqui publicaria no app local vazio, não no original.

---

## 5. A decisão que falta — `D1`

Nada além disto está bloqueando. As três saídas são excludentes:

| saída | o que significa | custo |
|---|---|---|
| **A. Arquivo morto** | a pasta fica como cópia de segurança e leitura; o produto continua sendo editado na Base44 | zero |
| **B. Sair da Base44** | o código vira projeto próprio; troca-se `@base44/sdk` por backend nosso (`api-` em Bun + Postgres/Drizzle, pelas regras do ecossistema) | alto — o SDK aparece em ~45 chamadas |
| **C. Ficar na Base44, evoluir no código** | usa-se o app local como ambiente de desenvolvimento e publica-se de volta | médio — depende de o eject ter caminho de volta |

### ✅ D1 decidida em 04/09/2026 — saída **B, sair da Base44**

A medição feita depois da decisao mostrou que ela e' menor do que o quadro acima
sugeria: **nao existe nenhuma funcao de backend propria** (`base44/functions`
nao existe). Todo o servidor da Base44 que este app usa e' CRUD generico sobre 7
tabelas, autenticacao, e uma chamada de IA. Detalhamento e plano: `ADR-001.md`.

Os achados §4.1 e §4.2 passam a ser corrigidos **no codigo novo**, nao neste.

Exceção: **§4.3 é independente da saída.** A exposição existe no app que está no
ar hoje, e nenhuma das três saídas a resolve sozinha.

---

## PRONTO

- [x] Código do app original baixado para `~/Documents/personal/pai-presente`
- [x] Projeto lido: estrutura, stack, 7 entidades, 8 páginas, mapa de uso do SDK
- [x] Achados registrados sem editar nenhum arquivo do projeto
- [x] `D1` — **saída B: sair da Base44** (04/09/2026)
- [x] `TB.1` — superfície do SDK medida (21 chamadas, 4 famílias) → `ADR-001.md`
- [x] `TB.2` — ADR-001 aprovado; as cinco decisões fechadas (`ADR-001.md` §6):
      base de dados do zero, PWA, provider de IA por env, Fly.io/Railway, login Google+Apple
- [x] `TB.3` — monorepo, `envs/`, `docker-compose.yml` e `Makefile`
      (aceite do `make up` pendente: **falta um runtime de Docker** na máquina)
- [x] `TB.4` — schema Drizzle das 7 entidades, migration aplicada e revertida
      em banco limpo; sem as três colunas sensíveis, que esperam `TL.1`
- [x] `TB.5` — as 25 rotas dos 7 recursos, com 56 testes de contrato
      (feliz e falha por rota); toda rota `/v1` responde **401** até `TB.6`
- [x] `TB.6` — login Google/Apple por `id_token`, sessão só em cookie
      `HttpOnly`+`SameSite` (`Secure` fora de dev), refresh rotativo com revogação
      em cadeia no reuso; 17 testes novos, e o de aceite falha se o token
      aparecer no corpo ou na URL
- [ ] §4.3 — decidir o que fazer com os três campos sensíveis obrigatórios
- [ ] Executar o `tasks.md` da saída escolhida

---

## Invariantes

1. **Não editar arquivo do projeto sem pedido explícito.** A instrução de origem
   foi "não edite nada"; este documento e o `tasks.md` são arquivos novos em
   `.specs/`, e nada fora dessa pasta foi tocado.
2. **Nunca confundir os dois app ids** (§2). Todo comando `base44` daqui age no
   app local `6a9b…`, não no original `6969…`.
3. **Não commitar `.env.local` nem `base44/.app.jsonc`** — carregam token e o id
   do app local.
4. **Dado sensível não vai para log** (`security.md` §1) — vale em dobro num app
   que guarda orientação sexual, religiosa e política.
5. **Achado sem medição é impressão.** Cada item de §4 tem o comando que o
   comprova; achado novo entra do mesmo jeito.
