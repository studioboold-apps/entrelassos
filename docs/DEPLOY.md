# Publicar o Pai Presente

Estado em 05/09/2026: **as imagens existem e foram provadas localmente; nada foi
publicado.** O que falta não é código — é a decisão `D6` (Fly.io ou Railway, e
qual domínio) e a conta no provedor escolhido.

---

## 1. O desenho, e por que a API não tem URL pública

Três peças: **web** (pública), **API** (privada) e **Postgres** (privado).

```
navegador ──HTTPS──> web (dist + repasse de /v1) ──rede privada──> API ──> Postgres
```

O cookie de sessão sai `SameSite=Lax` e **sem `Domain`** (host-only). Se a tela
morasse num host e a API em outro, o navegador guardaria o cookie no host da API
e não o devolveria em chamada vinda de outro **site** — e em `fly.dev`, que está
na Public Suffix List, `app.fly.dev` e `api.fly.dev` são sites diferentes. O pai
entraria, a tela recarregaria deslogada, e **não apareceria erro nenhum**.

Por isso a imagem da web repassa `/v1` para `API_ORIGIN`, exatamente como o proxy
do Vite faz em desenvolvimento. Consequências que valem dizer em voz alta:

- a API **não precisa** de endereço público — `API_ORIGIN` aponta para a rede
  interna do provedor (`*.railway.internal` ou `*.internal` no Fly);
- não há CORS a configurar: é tudo mesma origem;
- `VITE_API_BASE_URL` fica **vazia** nos dois ambientes.

## 2. Migrations no deploy

O comando é sempre este, e ele roda **de dentro da imagem da API**:

```
bun dist/database/migrate.js
```

Nunca `drizzle-kit push` (`database.md`): empurrar schema não deixa migration
revisável e não tem volta escrita.

| provedor | onde declarar |
|---|---|
| Fly.io | `[deploy] release_command` no `fly.toml` da API |
| Railway | *pre-deploy command* do serviço da API |

Nos dois casos o passo roda **antes** de a versão nova receber tráfego, e o
deploy para se ele falhar.

Provado localmente (`make image-smoke`): `migrate (de dentro da imagem) -> ok`.

## 3. `/health` responde pelo banco

`GET /health` faz `select 1` e devolve **503** se o banco não responde. Isso
existe porque a saúde fixa mentia: na primeira fumaça o contêiner respondeu
`{"status":"ok"}` com o banco **inalcançável** — e é esse endereço que o
provedor consulta para decidir se promove o deploy.

Configure o health check do provedor em `/health` do serviço da API **e** do
serviço da web.

Medido: `api /health -> {"data":{"status":"ok","database":"ok"}}`, e
`api /health SEM banco -> HTTP 503`.

## 4. Variáveis por serviço

Nenhum valor mora neste arquivo nem no repositório (`security.md` §4).

### API (variáveis de execução)

| nome | obrigatória | observação |
|---|---|---|
| `DATABASE_URL` | sim | endereço privado do Postgres do provedor |
| `AUTH_JWT_SECRET` | sim | mínimo 32 caracteres, rotacionável |
| `LLM_PROVIDER` | sim | sem padrão, de propósito (`D8`) |
| `LLM_API_KEY` | depende de `D8` | sem ela, quatro rotas respondem 503 |
| `GOOGLE_CLIENT_ID` | sim | identificador público; sem provedor nenhum a API **recusa subir** |
| `APPLE_CLIENT_ID` | não | `D7` ainda aberta; a recomendação é só Google no lançamento |
| `NODE_ENV` | já vem `production` na imagem | é o que liga `Secure` no cookie |
| `API_PORT` | não | padrão 3000 |
| `WEB_ORIGINS` | não | com mesma origem, não há CORS a liberar |

`AUTH_DEV_SIGN_IN` **não existe em produção**: com `NODE_ENV=production` o boot
recusa. Isso é proposital (fail-closed, `security.md` §2).

### Web (variáveis de execução)

| nome | obrigatória | observação |
|---|---|---|
| `API_ORIGIN` | sim | endereço **interno** da API; sem ela o processo falha no boot |
| `WEB_PORT` | não | padrão 8080 |

### Web (argumentos de **build** — o Vite assa no bundle)

| nome | observação |
|---|---|
| `APP_ENV` | `web.md` §12: ausente ou desconhecido cai em `production` |
| `GOOGLE_CLIENT_ID` | público por natureza; o navegador o lê no bundle |
| `APPLE_CLIENT_ID` | idem |

**Segredo nunca vira `--build-arg`** — ele fica gravado na camada da imagem.

## 5. HTTPS e cabeçalhos

A imagem da web carimba os seis cabeçalhos em tudo o que ela mesma produz —
`Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`,
`X-Content-Type-Options`, `Referrer-Policy` e `Permissions-Policy`. O repasse de
`/v1` sai **intacto**: a API já traz os dela, e uma CSP de documento colada em
JSON só confunde quem for depurar.

O TLS é terminado pelo provedor. Ligue o redirecionamento dele mesmo assim
(`force_https = true` no Fly; ligado por padrão no Railway): a imagem também
desvia com **308** quando o proxy diz `x-forwarded-proto: http`, mas isso é
cinto sobre suspensório — o desvio da borda evita a primeira viagem em texto
puro, que é onde o cookie escaparia.

`Strict-Transport-Security` vai com `max-age=31536000; includeSubDomains` e
**sem `preload`**: entrar na lista de pré-carga dos navegadores não tem volta
rápida, e isso se decide com o domínio definitivo na mão.

Detalhes e a dívida do `style-src` estão em `docs/SECURITY.md` (`S-005`).

## 6. `D6` continua aberta, e a medição que ela precisa

| item | medido em 05/09/2026 |
|---|---|
| `flyctl` | **não instalado**; `~/.fly` não existe — exige instalar, criar conta e cadastrar cartão |
| `railway` | **instalado (5.47.1) e autenticado** na conta do dono do projeto |
| região | o argumento a favor do Fly é `gru` (São Paulo); confirmar a região sul-americana do Railway antes de trocar |
| domínio | ninguém disse ainda se existe um |

A recomendação do `GOAL.md` continua **Fly.io** (Postgres gerenciado, região em
São Paulo, e o app é PWA — latência conta). A conta já pronta é a do Railway.
A escolha custa dinheiro e é do dono do projeto.

## 7. Quando `D6` fechar

1. criar o Postgres gerenciado e pegar o endereço privado;
2. criar os dois serviços apontando para `apps/api-pai-presente/Dockerfile` e
   `apps/frontend-pai-presente/Dockerfile`, com a **raiz do monorepo** como
   contexto de build;
3. declarar as variáveis da §4 e o comando de migration da §2;
4. apontar o health check em `/health` nos dois;
5. `APP_ENV=production` no build da web — sem ele o valor não entra no bundle.

O aceite de `F4.2` é URL pública respondendo `/health` e a tela falando com a
API. Enquanto os passos acima não rodarem, ele não está atingido.

## 8. O backup, quando `D6` fechar

O alvo de backup **não sobe na imagem da API**. `pg_dump` não existe na imagem
oficial do Bun, e instalar `postgresql-client` no serviço que atende HTTP
engordaria a superfície de toda requisição por causa de um trabalho que roda uma
vez por dia. O `Dockerfile` da API tem um estágio `backup` só para isso:

```bash
docker build -f apps/api-pai-presente/Dockerfile --target backup -t pai-presente-backup .
```

Medido em 05/09/2026 dentro da imagem: `pg_dump 17.11`, `psql 17.11`, e
`bun dist/backup/run-backup.js` chega à validação de ambiente. A versão do
cliente **acompanha a do servidor** — `pg_dump` mais velho que o banco recusa o
dump, e essa recusa só apareceria na primeira execução agendada.

O caminho é `dist/backup/run-backup.js`, não `dist/run-backup.js`: com várias
entradas o `bun build` preserva o caminho relativo à raiz comum. Escrito errado,
a imagem constrói, sobe, e só falha no primeiro agendamento.

### Agendamento

| item | valor |
|---|---|
| frequência | diária, fora do horário de pico |
| comando | `bun dist/backup/run-backup.js` |
| restauração | `bun dist/backup/run-restore.js [chave-do-objeto]` — sem argumento, o mais recente |
| onde | Fly: `fly machine run --schedule daily`; Railway: serviço de cron apontando para o mesmo estágio |

### Variáveis do trabalho de backup

| variável | valor em produção |
|---|---|
| `DATABASE_URL` | o endereço **privado** do Postgres, o mesmo da API |
| `BACKUP_DESTINATION` | `s3` |
| `BACKUP_S3_BUCKET` / `BACKUP_S3_ENDPOINT` | o balde privado e o endpoint do provedor |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | credencial **só deste balde**, e diferente da de staging (`security.md` §7) |
| `BACKUP_ENCRYPTION_KEY` | 32 bytes em base64, **guardados fora do balde** |
| `BACKUP_ENVIRONMENT` | `production` — entra no nome do objeto e separa os ambientes dentro do balde |

### A guarda da chave

A chave de cifra **não pode viver no mesmo lugar que o cifrado**: com as duas
juntas, o vazamento do balde é o vazamento do banco inteiro. Ela é segredo do
provedor de execução (`fly secrets set` / variável do Railway), nunca
`--build-arg` — argumento de build fica assado na camada da imagem, legível por
quem puxar a imagem.

Gerar: `openssl rand -base64 32`. **Perder a chave é perder todos os backups
cifrados com ela** — não há recuperação, é AES-256-GCM. Guardar uma cópia no
cofre de senhas do dono do projeto faz parte de fechar `D6`.

### O restore precisa ser ensaiado no ambiente publicado

`make backup-proof` prova o ciclo **localmente** (§ *Backup cifrado* em
`SECURITY.md`). Ele não prova a rede, a credencial do balde nem a chave em
produção. O primeiro backup publicado tem de ser restaurado num banco
descartável antes de alguém considerar a produção protegida: backup que nunca
voltou não é backup, é esperança.
