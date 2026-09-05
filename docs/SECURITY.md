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
| S-004 | **Três campos sensíveis obrigatórios** (`sexual_orientation`, `religious_orientation`, `political_orientation`) herdados da Base44. `sexual_orientation` não tem **nenhum** consumidor; os outros dois existem só para alimentar o prompt de IA — que é exatamente o uso que exige consentimento específico (LGPD art. 11) | usuário — `TL.1` |
| S-005 | Cabeçalhos de resposta e CSP sem `unsafe-inline` ainda não estão declarados no servidor de produção — hoje só há o `Bun.serve` de desenvolvimento | task de publicação |
