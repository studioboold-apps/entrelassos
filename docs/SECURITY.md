# Segurança — Pai Presente

Achado de segurança vira item datado aqui (`security.md` §10), não some no
histórico de conversa.

---

## Auditoria de 04/09/2026 — entrega do PWA (`TB.10`)

Escopo: `code-standart.md` §15 (auditoria de go-live) e `security.md` §10, sobre
o que a task tocou — service worker, cache, `index.html` e ambiente do build.

### Corrigido nesta task

| # | Achado | Correção |
|---|---|---|
| S-001 | **Cache de API é do aparelho, não da sessão.** `NetworkFirst` sobre `/v1/` grava resposta com dado de criança no `CacheStorage`, que sobrevive ao logout: no celular compartilhado, o próximo a entrar leria os dados do pai anterior | `forgetCachedApiResponses()` (`src/lib/pwa-cache.js`) apaga o cache da API no `finally` do `logout`; validade de 1 dia e só `status 200` no cache |
| S-002 | **Registro do service worker inline forçaria `unsafe-inline` na CSP** (`security.md` §3) — o padrão do `vite-plugin-pwa` injeta `<script>` no `index.html` | `injectRegister: 'script-defer'`; verificado no `dist/index.html`, que sai com `src="/registerSW.js"` |
| S-003 | **`navigateFallback` devolveria o HTML do app para chamada de API offline**, e o cliente receberia HTML onde esperava JSON — erro que não diz "você está sem conexão" | `navigateFallbackDenylist: [/\/v1\//]` |

### Medido e limpo

| Verificação (`code-standart.md` §15) | Resultado |
|---|---|
| Segredo inlinado no bundle | nenhum — `grep` por `AUTH_JWT_SECRET`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `sk-…` em `dist/` não devolve nada |
| O que o `define` injeta | só `GOOGLE_CLIENT_ID`, `APPLE_CLIENT_ID`, `APP_ENV` — os três públicos por definição |
| Token em `localStorage` | não existe; a sessão é cookie `HttpOnly` (`src/api/http.js`) |
| `dangerouslySetInnerHTML` fora do shadcn | nenhuma ocorrência |
| `console.log/debug/info` no código do produto | nenhuma ocorrência |
| Stack trace na resposta HTTP | nenhum `.stack` na API; o teste do `INTERNAL_ERROR` afirma que a causa fica só no log |
| Método cacheado pelo service worker | só `GET` (padrão do workbox); `POST /v1/auth/sessions` nunca entra em cache |
| PII no nome de arquivo em cache | não — as chaves são as rotas, sem identificador de pessoa |

### Aberto

| # | Item | Quem decide |
|---|---|---|
| — | nada em aberto no momento | — |

### Fechado em 05/09/2026 — `S-005`, cabeçalhos e CSP (`F4.3`)

Medido nas imagens de produção, não presumido:

```
web  blindagem  -> 6 de 6 cabecalhos
web  script-src ->  script-src 'self' https://accounts.google.com https://appleid.cdn-apple.com
api  blindagem  -> 6 de 6 cabecalhos
```

Os seis: `Content-Security-Policy`, `Strict-Transport-Security`,
`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` e
`Permissions-Policy`.

A tela e a API têm políticas **diferentes**, de propósito: a API só devolve
JSON, então a dela é `default-src 'none'; frame-ancestors 'none'` — resposta que
nunca vira documento não precisa liberar origem nenhuma.

`script-src` **sem `unsafe-inline` e sem `unsafe-eval`**. Isso só foi possível
porque o `index.html` construído não tem um `<script>` embutido sequer: o
registro do service worker virou arquivo próprio (`registerSW.js`, decisão
`TB.10`). Verificado no `dist` gerado, não no arquivo-fonte.

Quem chega em texto puro atrás do proxy leva **308** para `https` — e 308, não
301, porque o 301 faz cliente antigo trocar POST por GET, e o corpo do login
sumiria calado. Sem `x-forwarded-proto` não há desvio: aí não existe proxy na
frente, é a imagem rodando na máquina de quem desenvolve.

#### A dívida que fica escrita: `style-src 'unsafe-inline'`

Medido: **35 usos de `<motion.` em 12 arquivos**. O framer-motion anima
escrevendo no **atributo** `style` a cada quadro, o Radix posiciona popover do
mesmo jeito, e o `offline.html` tem um `<style>` embutido. `style-src-attr` sem
`'unsafe-inline'` mataria os três — tirar isso é trocar de biblioteca de
animação, que é decisão de produto, não de cabeçalho.

O risco que sobra é pequeno perto do de script: estilo injetado desfigura a
página, não executa código. Um teste afirma que **existe exatamente uma**
ocorrência de `'unsafe-inline'` na política inteira, para que ninguém a copie
para `script-src` sem que o teste reprove.

---

## Decisão de 05/09/2026 — os três campos sensíveis (`TL.1`, fecha S-004)

**Os três saem. Nenhum deles existe na base nova, e nenhum volta sem passar por
consentimento específico.**

### Base legal

`sexual_orientation`, `religious_orientation` e `political_orientation` são dado
pessoal **sensível** pela LGPD art. 5º, II. Guardá-los exigiria consentimento
**específico e destacado** (art. 11, I) — não serve o aceite genérico de termos
—, e o produto guarda junto o cadastro de **crianças**, o que sobe o custo de um
vazamento de "constrangedor" para "irreparável".

### O que eles compravam, medido

| Campo | Consumidor na Base44 | Consumidor hoje |
|---|---|---|
| `sexual_orientation` | **nenhum** | nenhum |
| `religious_orientation` | prompt de IA | nenhum — `ai.prompt.ts` não o pede |
| `political_orientation` | prompt de IA | nenhum — `ai.prompt.ts` não o pede |

O primeiro saiu de graça: ninguém o lia. Os outros dois melhoravam o texto do
mentor de um jeito que não paga o passivo de guardar religião e posição política
de quem tem filho pequeno.

### Onde a decisão está trancada

| Camada | Trava |
|---|---|
| Banco | as colunas **nunca existiram** no schema novo (`user.table.ts`) — não há migration de remoção a fazer |
| API | `PATCH /v1/me` é `.strict()`; teste em `user.controller.test.ts` afirma **400 `VALIDATION_FAILED`** para os três nomes |
| IA | `ai.prompt.ts` monta o prompt no servidor sem eles; o comentário na linha 20 registra por quê |
| Cliente | `pickProfileFields` não os transporta; testes de `Perfil.jsx` e `Onboarding.jsx` afirmam que as telas **não os pedem** |

### O defeito que isso conserta

O `Onboarding` continuava perguntando os três e **descartando a resposta antes de
enviar**. O pai declarava religião e posição política, o passo fechava sem
reclamar, e ele ficava achando que o aplicativo guardava aquilo. Pior que não ter
o campo: é pedir dado sensível e mentir sobre o destino dele.

O subtítulo do passo dizia *"Isso nos ajuda a personalizar os insights"* — falso
desde que o prompt deixou de recebê-los.

### Se algum dia voltar

Reintroduzir qualquer um deles exige, **antes** da coluna: consentimento
específico e destacado no próprio passo, finalidade escrita, opção de recusar sem
perder função, e caminho de eliminação (`DELETE /v1/me`, `F3.2`). Sem os quatro,
o campo não entra.


---

## Decisão de 05/09/2026 — trilha de auditoria e exportação (`F3.2`)

`DELETE /v1/me` e `GET /v1/me/export` existem desde esta task (LGPD art. 18, VI
e V). Três decisões de segurança ficam trancadas aqui, com o teste que as segura.

### A trilha NÃO referencia `users`

Todas as outras nove tabelas apontam para `users` com `onDelete: cascade` — é
isso que faz a exclusão limpar tudo de uma vez, sem ordem de exclusão escrita à
mão. Se `audit_log` fizesse o mesmo, **apagar a conta apagaria junto a prova de
que ela foi apagada**, que é exatamente o registro que o §10 manda guardar.

O ator entra como `uuid` solto. Trancado por `audit.table.test.ts`, que afirma
`foreignKeys` vazio: referenciar `users` é o reflexo de quem escreve tabela nova
neste esquema, e o teste existe para o dia em que alguém o seguir.

Exclusão e trilha caem ou passam na **mesma transação** — senão a auditoria
mente numa das duas direções.

### O IP vem do cabeçalho, não de `requestIP()`

A decisão D6 põe a API atrás de Fly.io ou Railway. Ali `server.requestIP()`
devolve o endereço do **proxy**, o mesmo para todo mundo: uma coluna cheia e
inútil, pior que a ausência porque parece prova. `readClientIp` lê o primeiro da
cadeia de `x-forwarded-for`, cai em `x-real-ip`, e admite `desconhecido` quando
não há cabeçalho nenhum.

O cabeçalho é **entrada não confiável**: cortado em 64 caracteres, porque sem
corte um valor de dez mil derruba o `INSERT` da auditoria — e com ele a exclusão
inteira, que roda na mesma transação.

Isto não contradiz o §1 (proibido PII em log): o §10 pede IP na trilha de forma
explícita, e trilha de auditoria não é log de aplicação.

### `sessions` fica de fora da exportação

É a única das dez que não entra. Ela guarda `refreshTokenHash`, material de
credencial: um arquivo baixado com ele dentro vira chave de sessão onde quer que
o arquivo pare. O e2e afirma que a string `refreshTokenHash` não aparece no
JSON exportado.

## Backup cifrado antes de subir (`security.md` §5)

O dump nunca sai em claro do processo. `create-backup.use-case.ts` chama o
`pg_dump`, cifra em memória com **AES-256-GCM** e só então entrega ao destino —
disco em desenvolvimento, S3 em produção, atrás da mesma interface
`BackupStorage`. O envelope é `magic(5) | iv(12) | authTag(16) | ciphertext`: a
etiqueta de autenticação viaja junto, então um arquivo adulterado **falha ao
decifrar** em vez de restaurar lixo silenciosamente.

**A chave fica fora do balde.** Ela vem de `BACKUP_ENCRYPTION_KEY`, variável de
ambiente validada no boot; o balde guarda só o cifrado. Guardar as duas coisas
no mesmo lugar transforma o vazamento do balde no vazamento do banco inteiro, e
é o modo de falhar que o §5 nomeia.

O nome do objeto é `pai-presente/<ambiente>/<AAAA-MM-DD>/<carimbo>.sql.enc` — só
tempo e ambiente. Nada de nome de criança nem de e-mail na chave (§7): o
inventário de um balde costuma ser legível por mais gente que o conteúdo dele.

### O restore é PROVADO, não presumido

`make backup-proof` roda o ciclo inteiro: semeia, cifra, guarda, cria um banco
descartável e restaura nele. Cada metade sozinha passa sem valer nada — cifrar
sem restaurar guarda um arquivo indecifrável, e restaurar sem comparar aceita um
dump truncado como sucesso.

A comparação **não é o sha do arquivo**. Medido: o mesmo banco, dumpado duas
vezes seguidas, dá dois shas diferentes (`88d21c43…` e depois `e2407ba9…`) — o
Postgres 17 abre cada dump com um `\restrict` de valor sorteado. Uma prova
montada assim reprova **sempre**, inclusive quando o restore está perfeito; eu
li "restore DIVERGIU" antes de descobrir que o defeito era a régua.

O que se compara é o que o restore precisa devolver:

| medida | como | por que existe |
|---|---|---|
| **dados** | `pg_dump --data-only` sem as linhas de sessão, em sha256 | é o conteúdo |
| **forma** | colunas e tipos de `information_schema`, em sha256 | tabela perdida que estava **vazia** não muda a medida de dados |

Última execução: envelope de 28 559 bytes, **0** ocorrências dos nomes semeados
dentro do cifrado, `dados` e `forma` idênticos nos dois lados.

## O log não carrega PII (`security.md` §1)

A redação mora no **logger**, não na disciplina de quem escreve a linha: chave
sensível vira `[REDACTED]` por nome (`email`, `name`, `childName`, `phone`,
`taxId`, …) e o texto livre passa por padrão (e-mail, CPF, telefone), porque a
mensagem de erro do Postgres chega com o valor grudado na frase — é o caminho
por onde o `cause` do filtro de exceção vazaria.

`make log-pii-audit` varre a **saída de uma API viva** respondendo pedido de
verdade, com cinco iscas plantadas, e não o código-fonte: `logger.info('salvo',
{ child })` passa em revisão e só aparece quando executa. Vinte chamadas,
metade recusada de propósito.

Duas defesas contra a varredura que passa por estar cega:

1. **Controle positivo.** O detector vive em `scripts/log-pii.detector.ts` com
   oito testes que exigem que ele ache cada isca. Sem eles, "nenhum achado"
   viraria carimbo de aprovação em vez de medição.
2. **Guarda de captura vazia.** Se a linha de boot não chegou ao cano, a
   varredura **falha** em vez de aprovar — arquivo esquecido produz varredura
   limpa por não ter medido nada.

As iscas são escolhidas: e-mail, CPF e telefone têm **padrão**, então o logger
os apaga até grudados numa frase; nome de pessoa **não tem padrão nenhum** e só
sobrevive pela redação por chave. Sem a isca de nome, a varredura mediria só
metade da defesa.

## Retenção de `audit_log` — 5 anos (fecha S-006)

A trilha sobrevive à exclusão da conta de propósito, mas "para sempre" não é
política: guardar sem prazo contraria a minimização do art. 6º da LGPD tão
diretamente quanto guardar de menos contraria o art. 48.

**Prazo: 5 anos** a contar do registro. É o teto entre os prazos que podem
cobrar a prova — 3 anos da reparação civil (art. 206 §3º do Código Civil) e 5
anos do CDC e da sanção administrativa da ANPD. Menos que isso apagaria a prova
antes de ela deixar de ser pedida.

O que a trilha guarda já é o mínimo (ator, alvo, IP cortado em 64, carimbo); a
retenção fecha a outra ponta.

### Aberto

| # | Item | Por quê |
|---|---|---|
| S-007 | A purga dos 5 anos ainda não roda sozinha | O prazo está definido (acima) e a coluna existe; falta o trabalho agendado que apaga. Enquanto não existir, a retenção é política escrita e não comportamento — e o que não executa não protege |
| S-008 | **A senha do Postgres de produção apareceu no meu terminal e precisa ser rotacionada** | Ver abaixo. A rotação derruba a conexão da API até o redeploy pegar a senha nova, então quem escolhe a hora é você |

---

## `S-008` — senha do Postgres queimada no terminal (05/09/2026)

**O que houve.** Ao conferir o ambiente do Railway eu rodei
`railway variables --service api`, que imprime a tabela com a `DATABASE_URL`
inteira. A máscara que apliquei depois pegou a linha, mas **não a célula
quebrada em duas linhas** pela largura da tabela, e a senha saiu legível na
saída do comando. `security.md` §4 não abre exceção: *segredo que apareceu em
terminal é segredo queimado*.

Depois disso toda leitura de variável passou a sair por `--json` num filtro que
imprime só fato derivado — comprimento e prefixo de hash. Foi assim que a
auditoria acima foi feita, e é assim que ela deve continuar sendo feita.

**O que a medição diz sobre o risco real.** O serviço `postgres` **não tem proxy
TCP público**: as variáveis dele não trazem `RAILWAY_TCP_PROXY_DOMAIN` nem
`RAILWAY_TCP_PROXY_PORT`, e o único endereço é `postgres.railway.internal:5432`,
que só existe dentro da rede privada do projeto. Quem tivesse a senha e não
tivesse acesso ao projeto no Railway não teria por onde usá-la. Isso **reduz a
urgência e não dispensa a rotação** — a regra é sobre o segredo ter vazado, não
sobre alguém ter conseguido usá-lo.

**Por que ainda não rotacionei.** A rotação tem uma janela em que a senha do
papel no banco e a das variáveis do serviço não são a mesma, e nessa janela a
API não conecta. É operação em produção com o app no ar; a hora é decisão de
quem opera, não minha.

**Procedimento, quando for a hora:**

1. Gerar a senha nova fora do terminal (o gerador do Railway, ou um cofre).
2. `ALTER USER postgres WITH PASSWORD …` no banco, pela sessão do próprio
   Railway — nunca com a senha escrita na linha de comando, que vai para o
   histórico do shell.
3. Trocar `POSTGRES_PASSWORD` e `PGPASSWORD` no serviço `postgres`. A
   `DATABASE_URL` da API é **referência** (`database.env.DATABASE_URL` no IaC),
   então ela se recompõe sozinha.
4. Redeploy da API para pegar o valor novo, e conferir por `/health` — que já
   dá um `select 1` no banco, então ele responde a pergunta certa.
5. Conferir que `railway config plan` continua sem acusar deriva.

## Decisão de 31/10/2026 — foto e áudio no chat do mentor

O pai pediu para mandar **foto** e **áudio** ao mentor. A regra `D2` (arquivo
do filho nunca vai para a IA) continua de pé: `ai.file-boundary.test.ts` segue
reprovando qualquer caminho do histórico do filho (`ChildFile`, mídia cifrada)
até o prompt. O que entrou é outra coisa, e com limites escritos:

| o quê | vai para | fica guardado? |
|---|---|---|
| foto anexada no chat | provedor de IA (`LLM_PROVIDER`), só na pergunta em que foi anexada | **não**. O app reencoda em JPEG ≤ 1568 px (o que também tira o EXIF com a localização) e grava na conversa só o texto com a marca `📷` |
| áudio gravado no chat | OpenAI (`TRANSCRIPTION_API_KEY`), para virar texto | **não**. O texto volta para a caixa de pergunta e o pai confere antes de enviar |
| conversa anterior | provedor de IA, as últimas 20 falas | já estava em `chat_messages`; agora o mentor a lê para ter memória |

É o pai quem escolhe, foto a foto, o que mandar — nada sai do álbum do filho
sozinho. O tipo da foto e do áudio é decidido pelos **bytes** na API, e o
corpo nunca entra em log (`security.md` §1).
