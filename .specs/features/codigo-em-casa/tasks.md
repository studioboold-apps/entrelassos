# tasks — código em casa (Pai Presente)

Ordem obrigatória. Um commit por task, com o motivo no corpo.
Tudo depois de `T2` está **travado por `D1`** (GOAL §5).

---

## Fase 0 — o que não depende da decisão
> 🤖 Modelo: `sonnet`

### T0.1 — Provar que o app sobe local
- **Comando:** `npm run dev` na raiz do projeto
- **Aceite:** abre no navegador, o Onboarding aparece, e o banco está vazio
  (nenhum filho listado) — confirmando o §2 do GOAL na prática
- **Não corrigir nada** que aparecer; anotar no GOAL como achado novo

### T0.2 — Confirmar que a aba Comunidade quebra
- **Comando:** subir o app, tocar "Comunid." na barra inferior
- **Aceite:** cai em `PageNotFound`
- **Por quê:** o achado §4.1 é de leitura de código; um achado que ninguém viu
  na tela é hipótese, não medição

### T0.3 — Levantar a exposição real de §4.3
- **Pergunta a responder:** o app no ar já coletou orientação sexual, religiosa
  e política de quantas pessoas?
- **Onde:** painel da Base44 do app original `69693b3d8c5d3c2fd0c67ca4`
  (conta `fabricio.tr@gmail.com`) — **não** o app local
- **Aceite:** um número. Zero muda a urgência tanto quanto mil mudariam
- **⚠️ Não exportar, não copiar e não logar os valores** — só a contagem

---

## 🔒 D1 — decisão do usuário
> 🤖 Modelo: `opus` 🧠

Escolher entre **A (arquivo morto)**, **B (sair da Base44)** e
**C (ficar, evoluir no código)** — GOAL §5.
Registrar a escolha e o motivo no GOAL antes de seguir.

---

## Fase A — arquivo morto
> 🤖 Modelo: `haiku`

### TA.1 — Congelar
- Nenhuma alteração de código
- `README.local.md` na raiz dizendo: qual é o app original, que este clone tem
  banco vazio, e que editar aqui não muda o que está no ar
- **Aceite:** quem abrir a pasta daqui a seis meses entende em 30 segundos por
  que ela existe

---

## Fase B — sair da Base44  ✅ ESCOLHIDA
> 🤖 Modelo: `opus` 🧠 no desenho, `sonnet` na execução
> Base: `ADR-001.md`

### TB.1 — Mapear a superfície do SDK ✅ feito
21 chamadas, 4 famílias, **nenhuma função de backend própria**.
Resultado em `ADR-001.md` §1.

### ~~TB.0 — exportar os dados~~ ❌ cancelada
`D2` decidiu começar do zero. Não há dado a exportar, e some junto o risco de
manusear dado pessoal real fora do ambiente dele.

### TB.2 — Fechar o ADR ✅ feito
As cinco decisões fechadas: base do zero, PWA, provider de IA por env,
Fly.io/Railway, login Google+Apple. ADR-001 com status **aprovado**.

### TB.3 — Monorepo e infra local ✅ feito (aceite parcial)
- `apps/api-pai-presente`, `apps/frontend-pai-presente`, `envs/`,
  `docker-compose.yml`, `Makefile` (`code-standart.md` §2 e §4)
- O frontend atual **move sem alteração** — mover e reescrever no mesmo passo
  esconde qual dos dois quebrou
- **Aceite:** `make up` sobe Postgres; o frontend ainda roda contra a Base44
- ⚠️ **`make up` não foi verificado, e não dá para verificar hoje:** existe o
  CLI do Docker (28.5.1) mas **nenhum runtime instalado** — sem Docker Desktop,
  OrbStack ou Colima, o `docker.sock` não tem quem atenda. Falta instalar um dos
  três; até lá o Postgres local do Homebrew (18.4) cobre o desenvolvimento

### TB.4 — Schema Drizzle das 7 entidades ✅ feito
- VARCHAR no lugar de ENUM, PK em UUID, migrations versionadas
- **Aceite:** migration aplica e reverte em banco limpo
- **⚠️ Os três campos sensíveis de `User` dependem de `TL.1`** — não criar
  coluna para dado cuja permanência ainda não foi decidida

**Provado em 04/09/2026** contra um cluster PostgreSQL 18 descartável (o Docker
Desktop não está instalado nesta máquina — ver TB.3): migration aplica, as 8
tabelas nascem, `DROP SCHEMA … CASCADE` derruba tudo, e a reaplicação em banco
limpo recria as 8. Fumaça verificada no mesmo banco: UUID gerado pelo servidor,
`join` de atividade com filho, o unique de `insight_ratings` recusando a nota
repetida, e o `ON DELETE CASCADE` esvaziando filhos, atividades e notas ao
apagar o pai.

**Três decisões de modelagem que divergem da Base44, e o motivo:**

| Base44 | aqui | por quê |
|---|---|---|
| `Activity.child_name` ao lado de `child_id` | só `child_id` | o nome é derivado do vínculo (`Juntinhos.jsx:107`); cópia diverge na primeira edição. A API devolve `childName` pelo join |
| `CommunityPost.likes_count` + `liked_by[]` | tabela `community_post_likes` | duas verdades para o mesmo fato; a contagem sai do `COUNT` |
| `author_name` em post e comentário | só `author_id` | mesma cópia derivada, mesmo defeito |

Isso muda o **formato de resposta** que o frontend espera — é trabalho de
`TB.8`, não uma quebra escondida.

### TB.5 — API REST dos 7 recursos
- `/v1/children`, `/v1/activities`, `/v1/insight-ratings`,
  `/v1/community/posts`, `/v1/community/comments`, `/v1/chat/messages`, `/v1/me`
- Zod na fronteira, envelope `{ data }`, erro `{ error: { code, message } }`
- **Aceite:** teste de contrato por rota, caminho feliz e de falha

### TB.6 — Autenticação
- Cookie `HttpOnly`+`Secure`+`SameSite`, access ≤15 min, refresh rotativo
- **Aceite:** o token **não** aparece em URL nem em `localStorage`
  (`ADR-001.md` §2.1) — teste que falha se aparecer

### TB.7 — Os 4 endpoints de IA
- `/v1/insights`, `/v1/activity-suggestions`, `/v1/report`, `/v1/chat`
- Saída estruturada equivalente aos 4 `response_json_schema` de hoje
- **Aceite:** a chave do provedor **não** existe no bundle do frontend
- **⚠️ Rate limit por usuário** — rota que gasta dinheiro externo
  (`security.md` §3)

### TB.8 — Trocar o encanamento do frontend
Sete arquivos (`ADR-001.md` §3). As 8 páginas não mudam.
- `api/base44Client.js` → cliente nosso · `lib/AuthContext.jsx` → nosso fluxo
- `lib/app-params.js` → **deletado** · `vite.config.js` → sai o plugin deles
- `lib/NavigationTracker.jsx` → sai `appLogs`
- **Aceite:** `grep -r "base44" src/` não devolve nada

### TB.9 — Consertar os dois defeitos herdados
- §4.1 registrar a rota de `Comunidade` · §4.2 fazer o chat persistir
- **Aceite:** a aba abre; a conversa sobrevive a fechar e reabrir
- Cada um vira **teste antes do conserto**

### TB.10 — PWA de verdade, e a virada
Hoje o app **se declara PWA e não é**: `index.html` aponta para
`/manifest.json` e o arquivo não existe (`ADR-001.md` §6.1).
- `vite-plugin-pwa`: manifest, ícones 192/512 PNG, service worker
  (cache-first asset / network-first API), `offline.html` com a marca
- Corrigir `index.html`: título `Pai Presente`, ícone nosso (hoje é o logo da
  **Base44** vindo do site deles), `lang="pt-BR"`
- Aviso de ambiente do `web.md` §12: 🚧 no ícone fora de produção
- ⚠️ **Depende de existir um ícone do produto** — única dependência de arte
- Banco abre **vazio** (`D2`)
- **Aceite:** o celular oferece instalar; auditoria de `code-standart.md` §15
  + `security.md` §10

## Fase C — ficar na Base44, evoluir no código
> 🤖 Modelo: `sonnet`

### TC.1 — Descobrir se existe caminho de volta
- **Pergunta:** o `base44` CLI publica deste clone para o app **original**, ou
  só para o app local?
- **Comando:** `base44 --help` e a documentação de `link` / `deploy`
- **Aceite:** resposta com evidência. **Se não houver caminho de volta, a Fase C
  não existe** e `D1` volta à mesa
- **⚠️ Nenhum comando de escrita contra o app original sem o usuário confirmar**

### TC.2 — Registrar a rota de Comunidade (§4.1)
- Uma linha em `src/pages.config.js`
- **Aceite:** a aba abre a página em vez de `PageNotFound`

### TC.3 — Fazer o chat persistir (§4.2)
- `Chat.jsx` passa a gravar e ler `ChatMessage`
- **Aceite:** fecha o app, reabre, a conversa está lá

---

## Transversal — §4.3, LGPD
> 🤖 Modelo: `opus` 🧠 · **vale em qualquer saída**

### TL.1 — Decidir o destino dos três campos sensíveis

**Medido em 04/09/2026** — onde cada campo é de fato consumido:

| campo | consumidores |
|---|---|
| `sexual_orientation` | **nenhum.** Coletado no Onboarding, exibido no Perfil, e mais nada. Obrigatório no schema e sem uso |
| `religious_orientation` | prompt da IA em `Chat.jsx:63`, `Home.jsx:78`, `Comunidade.jsx:72` |
| `political_orientation` | prompt da IA em `Home.jsx:79`, `Comunidade.jsx:73` |
| `marital_status` | só Onboarding e Perfil — **não é dado sensível** pela LGPD art. 11 |

Isto pesa na decisão: o campo mais delicado dos três é o único que não serve
para nada hoje. E os outros dois só existem porque saem daqui para o provedor
de IA — o que é justamente o uso que exige consentimento específico.
Três opções, e a escolha é do usuário:
1. **Remover** — o produto funciona sem eles?
2. **Tornar opcionais** + consentimento específico e destacado, com a finalidade
   escrita (LGPD art. 11, I)
3. **Manter obrigatórios** — exige base legal registrada e aceitar o passivo

- **Aceite:** decisão escrita no GOAL, com o número de T0.3 ao lado
- **Nunca:** decidir isto por conveniência técnica. É decisão jurídica com
  consequência para quem já se cadastrou
