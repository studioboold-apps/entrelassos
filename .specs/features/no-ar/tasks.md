# Tasks — Pai Presente no ar

Execute em ordem. **Um commit por task**, com o motivo no corpo — não só o quê.

Gates de toda task (`model-economy.md` §3):

```bash
bun test                                                        # 127 hoje; nunca menos
cd apps/frontend-pai-presente && ./node_modules/.bin/tsc -p ./jsconfig.json  # 215 hoje; nunca mais
```

215 é linha de base, não meta: é ruído de `checkJs` sobre `forwardRef` do shadcn.
Task que sobe o número introduziu erro de verdade.

---

## Fase 1 — Rodar de ponta a ponta
> 🤖 Modelo: `sonnet` (`F1.2` é 🧠 — é decisão de segurança)

### `F1.1` — a migration não depende da chave de IA
**Depende de:** nada.
**Problema medido:** `bun run db:migrate` morre com
`ZodError: LLM_API_KEY: expected string, received undefined`. Criar tabela não
tem relação nenhuma com gerar texto; o schema de env é único para o processo
inteiro, então cada tarefa carrega as exigências de todas as outras.
**Fazer:** separar o schema em fatias por necessidade — banco, HTTP, login, IA —
e cada entrada (migration, seed, servidor) valida só a sua.
**Verificar:** `docker compose down -v && make up && bun run db:migrate` sem
nenhuma variável de IA definida.
**Aceite:** 10 tabelas criadas; o servidor continua exigindo o que ele precisa.

### `F1.2` 🧠 — caminho de desenvolvimento sem OAuth real
**Depende de:** `F1.1`.
**Problema medido:** `bun src/main.ts` → `nenhum provedor de login configurado:
defina GOOGLE_CLIENT_ID ou APPLE_CLIENT_ID` (`verifier-registry.ts:31`). Falhar
fechado está **certo** em produção e é o que impede desenvolver hoje.
**Fazer:** um provedor de identidade de desenvolvimento que emite sessão para um
usuário conhecido, habilitado só por variável explícita, e que **derruba o boot**
se `APP_ENV=production` — nunca por ausência de configuração.
**Verificar:** teste que sobe o registro com o provedor ligado e `production`, e
espera exceção.
**Aceite:** dá para logar localmente sem conta no Google; é impossível em produção.

### `F1.3` — porta e nomes sem colisão
**Depende de:** nada.
**Problema medido:** a porta 3000 desta máquina responde outro projeto. O
`Makefile` já propaga `PROJECT_NAME`; a porta não.
**Fazer:** porta por env em `envs/`, e conferir que todo recurso do compose
carrega o prefixo `$(PROJECT_NAME)-$(ENV)-`.
**Aceite:** `make up` com outro projeto rodando não colide em porta nem em nome.

### `F1.4` — seed pelos use cases
**Depende de:** `F1.1`, `F1.2`.
**Regra:** `code-standart.md` §5 — o seed instancia e executa os `*.use-case.ts`,
**nunca** `INSERT` bruto.
**Fazer:** um pai, dois filhos de idades diferentes, atividades em vários estados,
posts com comentário e curtida, e uma conversa de chat.
**Aceite:** `make seed` em banco limpo; rodar duas vezes não duplica.

### `F1.5` — o teste de fumaça que prova que existe produto
**Depende de:** `F1.1`–`F1.4`.
**Fazer:** um E2E em `env.test.e2e` que sobe a API de verdade e faz
entrar → criar filho → listar filho → criar atividade → concluir.
**Aceite:** verde em banco limpo, sem depender de seed nem de ordem.

---

## Fase 2 — As sete telas contra a API nova
> 🤖 Modelo: `sonnet`

Uma task por tela. Em todas: abrir no navegador com dado do seed, **anotar o
que aparece**, e cada defeito vira **teste antes do conserto** (invariante 2).
`web.md` §10 exige conferir em 375px, 768px e 1280px.

| task | tela | linhas | atenção |
|---|---|---|---|
| `F2.1` | Onboarding | 423 | é a porta de entrada; se ela falhar, nada mais é alcançável |
| `F2.2` | Home | 248 | primeira tela com dado do dia |
| `F2.3` | Juntinhos | 466 | atividades: `date` → `activityDate`, `completed` → `isCompleted` |
| `F2.4` | Chat | 237 | depende de chave de IA (`D8`); sem ela, prova o **erro** legível |
| `F2.5` | Boletim | 522 | insights e avaliação |
| `F2.6` | Comunidade | 265 | achado §4.1 do GOAL anterior: a rota existe? |
| `F2.7` | Perfil | 540 | onde os três campos sensíveis aparecem (`TL.1`) |

**Aceite de cada uma:** a tela desenha dado vindo da nossa API, sem erro no
console, e todo defeito encontrado tem teste que o reproduz.

---

## Fase 3 — LGPD
> 🤖 Modelo: `opus` 🧠 (`F3.1` é decisão jurídica; `F3.2` mexe em apagar dado)

### `F3.1` — os três campos sensíveis (`TL.1`)
**Depende de:** decisão do usuário (recomendação no GOAL: remover os três).
**Medido:** `sexual_orientation` não tem consumidor nenhum; `religion` e
`political_view` só entram no prompt de IA.
**Aceite:** o que ficar tem consentimento específico registrado e base legal
escrita em `docs/SECURITY.md`; o que sair, sai também do banco com migration.

### `F3.2` — apagar a conta e exportar os dados
**Depende de:** `F1.5`.
**Medido:** `/v1/me` só tem `GET` e `PATCH`. Art. 18 da LGPD dá ao titular
eliminação e portabilidade, e este produto guarda dado de **criança**.
**Fazer:** `DELETE /v1/me` apagando em cascata com trilha de auditoria
(`security.md` §10), e `GET /v1/me/export` devolvendo tudo em JSON.
**Aceite:** teste que cria, apaga e prova que nada do usuário sobrou em nenhuma
das 10 tabelas.

---

## Fase 4 — Publicar
> 🤖 Modelo: `sonnet` (`F4.3` é 🧠)

### `F4.1` — `Dockerfile` das duas apps
Build multi-estágio, imagem sem fonte nem segredo, `NODE_ENV=production`.
O `ARG` do `APP_ENV` faz parte do contrato (`web.md` §12): sem ele o valor não
entra no bundle e o frontend acha que é produção — ou pior, que não é.
**Aceite:** as duas imagens sobem localmente e respondem.

### `F4.2` — publicar no provedor de `D6`
Migrations aplicadas no deploy, nunca `drizzle-kit push` (`database.md`).
**Aceite:** URL pública respondendo `/health`, e o frontend falando com ela.

### `F4.3` 🧠 — HTTPS, cabeçalhos e CSP
Fecha `S-005` de `docs/SECURITY.md`: `X-Frame-Options`, `nosniff`,
`Referrer-Policy`, `Permissions-Policy`, HSTS, e CSP **sem `unsafe-inline`** —
que já é possível porque `TB.10` trocou o registro do service worker para
`script-defer`.
**Aceite:** medido no ar, não presumido.

### `F4.4` — backup e observabilidade
Backup criptografado **antes** do upload, chave fora do bucket
(`security.md` §5). Log estruturado com a máscara do `code-standart.md` §11 e
**sem PII** (§1) — este produto tem nome de criança em quase toda tabela.
**Aceite:** um restore provado, e uma varredura que não acha PII no log.

---

## Fase 5 — Entrada de verdade
> 🤖 Modelo: `sonnet`

### `F5.1` — credenciais reais
**Depende de:** `D7`.
Projeto no Google Cloud, tela de consentimento, e **origens JavaScript
autorizadas** — `https://web-production-1d6f.up.railway.app`.

**Não é `redirect_uri`.** Medido no bundle publicado: o login é o fluxo de
*token de identidade* do GIS (`accounts.google.com/gsi/client` está lá, e o
botão sai de `google.accounts.id.renderButton`), que resolve tudo dentro da
página e nunca redireciona. Campo de redirecionamento não é lido por esse
fluxo, e pedi-lo custaria uma rodada configurando o lugar errado.

**O encanamento já está pronto e vazio — medido em 05/09/2026.** No bundle no
ar, `Sz="AGUARDANDO-D7"` é o identificador do Google e `Pz=""` o da Apple: o
valor declarado no IaC atravessa o `--build-arg` do Railway, o `define` do
`vite.config.js` e chega ao navegador. A suspeita de que faltava o prefixo
`VITE_` no `Dockerfile` era falsa, e quem a derrubou foi um `grep` no bundle,
não a leitura do arquivo.

Como o marcador não é vazio, a tela **tenta** desenhar o botão: chama
`initialize` com um identificador que o Google não conhece, e o que sobra é
uma área vazia onde deveria estar o botão. Nada aqui é código a escrever —
falta só o valor real.

**Aceite:** uma pessoa entra no app publicado com a conta dela e cadastra um
filho. É o aceite do objetivo inteiro.

### `F5.2` — entrada por e-mail e senha, para não depender de `D7`

**Por que existe.** `F5.1` está bloqueada numa conta que não é nossa, e
enquanto ela não chega o produto no ar **não tem porta nenhuma**: o botão do
Google é desenhado com um identificador que o Google não conhece, e sobra uma
área vazia. Uma porta que não depende de terceiro é o que tira o objetivo do
estado "publicado e inalcançável".

**Senha NÃO é um `IdentityVerifier`.** O verificador transforma prova
**externa** em identidade e nunca toca no nosso banco; a senha lê o nosso
próprio armazém e ainda tem uma metade — o **cadastro** — que verificador
nenhum tem. Enfiá-la na interface obrigaria todo verificador a aceitar uma
prova que ele não sabe ler.

O corpo do login vira **união discriminada** por `provider`:
`{provider:'google'|'apple'|'dev', idToken}` contra
`{provider:'password', email, password}`.

**O que se guarda.** `auth_identities` com `provider='password'` e `subject` =
e-mail normalizado (o `unique(provider,subject)` que já existe é a busca),
mais `password_credentials` com o hash. Senha em `users` seria uma coluna nula
para todo mundo que entra por Google.

**Argon2id pelo `Bun.password`**, e **verificação boba em e-mail
desconhecido**: sem ela, a resposta volta rápido demais quando a conta não
existe, e o tempo enumera quem tem conta no app. A recusa é a mesma frase dos
outros provedores — nunca "senha errada", que confirma o e-mail.

**Envs, e a que fica esperando `D7`:**

| variável | valor | por quê |
|---|---|---|
| `AUTH_PASSWORD_SIGN_IN` | `1` por padrão | porta que não depende de terceiro; desligá-la é decisão explícita |
| `GOOGLE_CLIENT_ID` | **vazio** até `D7` | o marcador `AGUARDANDO-D7` é verdadeiro, e verdadeiro faz a tela TENTAR desenhar o botão. Vazio esconde |

O boot continua **fail-closed**: sem nenhum provedor **e** sem senha, a API não
sobe. Contar só verificador deixaria uma configuração só-senha morrendo no
boot.

`SignIn.jsx` é tocado, então paga a dívida dele (`docs/DEBITO.md`: 7 textos
cravados) na mesma passada — é o que aquele documento manda.

**Aceite:** cadastro e login por e-mail e senha no app publicado, sem Google
configurado; e a suíte cobrindo e-mail repetido, senha curta, senha errada e
e-mail desconhecido.

---

## Fase 6 — A dívida dos padrões
> 🤖 Modelo: `haiku` para o mecânico; `sonnet` onde há lógica a extrair

### `F6.1` — pagar onde já se mexeu, listar o resto
`web.md` §14 proíbe migrar tela que funciona só para adotar padrão. Então:
- tela tocada na Fase 2 sai com hook (`web.md` §4) e sem texto cravado (§6);
- o que não foi tocado vira lista datada em `docs/DEBITO.md`, com tamanho medido.

**Medido hoje:** zero `*.hook.js`, zero `*.locale.json`, 47 textos em português
dentro do JSX, quatro páginas acima de 400 linhas (teto do padrão: 200).
**Aceite:** nenhuma dívida sem dono — corrigida ou escrita com data.
