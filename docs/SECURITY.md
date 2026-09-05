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

### Aberto

| # | Item | Por quê |
|---|---|---|
| S-006 | Não há retenção definida para `audit_log` | A trilha sobrevive à conta de propósito, mas "para sempre" não é política. Definir prazo antes do go-live (`P4.4`) |
