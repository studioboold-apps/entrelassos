# Dívida de padrão do frontend — medida em 05/09/2026

`web.md` §14 proíbe migrar tela que funciona só para adotar padrão. Então o
corte de F6.1 é o **que já foi mexido na Fase 2**: essas telas saíram com hook
(§4) e sem texto cravado (§6). O que não foi tocado está aqui, **com data e com
tamanho medido** — dívida com dono, não dívida esquecida.

Quem mexer num destes arquivos por qualquer outro motivo paga a dívida dele na
mesma passada. Antes disso, não.

---

## O que F6.1 pagou

| medida | antes (medido em 04/09) | agora |
|---|---|---|
| `*.hook.js` | 0 | **9** |
| `*.locale.json` | 0 | **13** |
| Textos em português dentro do JSX das **páginas** | 47 | **0** |
| Páginas acima de 200 linhas | 4 (a maior: 520) | **0** (a maior: 181) |

Páginas, do maior para o menor: Home 181, Comunidade 180, Onboarding 169,
Chat 162, Perfil 140, Boletim 119, Juntinhos 116.

Duas duplicações de `code-standart.md` §16 morreram junto: as **dez categorias
de atividade**, que existiam em `Juntinhos.jsx` e em `Boletim.jsx`, e as
**quatro categorias de insight**, que `Boletim.jsx` redeclarava por cima de
`INSIGHT_CATEGORIES`.

---

## O que continua devendo

Quatro componentes que a Fase 2 não tocou. Nenhum deles tem `*.locale.json`, e
dois têm texto em português cravado no JSX.

| arquivo | linhas | textos cravados | o que falta |
|---|---|---|---|
| `components/CommunityPostCard.jsx` | 147 | 6 | locale (§6); a mutation de comentário mora no componente, não em hook (§4) |
| `components/CommunityCreatePost.jsx` | 77 | 6 | locale (§6); a mutation de publicação mora no componente (§4) |
| `components/EnvironmentBanner.jsx` | 29 | 0 no arquivo | as duas frases da faixa moram em `lib/environment.js`, em português cravado |
| `components/AuthLayout.jsx` | 23 | 0 | nada — recebe título e subtítulo por prop |

**Total: 12 textos nos componentes + 2 em `lib/environment.js` = 14.**

`components/SignIn.jsx` **saiu desta lista em 06/09**: a entrada por e-mail e
senha (`F5.2`) reescreveu a tela inteira, e a regra desta página — *quem mexer
num destes arquivos por qualquer outro motivo paga a dívida dele na mesma
passada* — cobrou as sete frases junto. Agora são 22 chaves em
`components/SignIn.locale.json`, e `SignIn.test.js` reprova qualquer literal
acentuado que volte para o JSX.

### A duplicação que sobrou, e por que ela fica

As **quatro categorias de post da comunidade** (`Experiência`, `Dica`, `Dúvida`,
`Conquista`) existem em duas cópias: `CommunityPostCard.jsx` linhas 13–16 e
`CommunityCreatePost.jsx` linhas 11–14. É a mesma falha de §16 que as categorias
de atividade tinham, e a correção é a mesma:
`lib/community-categories.js` + `locales/community.locale.json`, no molde de
`lib/activity-categories.js`.

Fica de fora hoje porque as duas telas não foram tocadas na Fase 2 — mexer nelas
agora seria exatamente a migração que §14 proíbe. **Quem editar qualquer uma das
duas, junta as duas.** As cópias concordam até a primeira edição, e esta já tem
duas.

### Por que os 175 erros de tipo não estão nesta lista

`bun run typecheck` acusa **175 erros** hoje (o teto herdado era 182). Quase
todos são a mesma coisa: componente `shadcn/ui` em `.jsx` sem tipo de prop, então
`checkJs` não sabe que `<Button>` aceita `children`. Não é dívida de padrão desta
fase — é o preço de tipar JavaScript com JSDoc — e `src/components/ui` já está
fora do `include` do `jsconfig.json` justamente por isso. Mexer aqui é migrar
`.jsx` para `.tsx`, que é outro trabalho e outra decisão.
