# Pai Presente

App para pais que querem criar filhos com propósito: insights diários,
calendário de atividades ("Juntinhos"), boletim mensal, comunidade e um chat
com IA.

**Este repositório está saindo da Base44.** O plano, as medições e as decisões
estão em [`.specs/features/codigo-em-casa/`](.specs/features/codigo-em-casa/):

| arquivo | o que é |
|---|---|
| `GOAL.md` | o rumo, o que já foi medido, e os achados |
| `ADR-001.md` | por que sair, como sair, e as 4 decisões (aprovado) |
| `tasks.md` | os passos, em ordem |

## Estrutura

```
apps/frontend-pai-presente/   React 18 + Vite — ainda fala com a Base44 (TB.8)
apps/api-pai-presente/        Bun.serve + Postgres + Drizzle — a nascer (TB.5)
packages/                     código compartilhado entre apps
envs/                         env.dev, env.test, env.test.e2e
.specs/reference/             registro do backend antigo da Base44
```

## Rodar

```bash
cp envs/env.dev.local.example envs/env.dev.local   # preencher os segredos
make install
make up          # Postgres local
make dev-web     # frontend na WEB_PORT do ambiente (envs/env.dev)
make help        # todos os alvos
```

⚠️ **O frontend ainda depende da Base44.** Até `TB.8`, ele fala com o app local
`6a9b4b26…`, que tem **banco vazio** — nenhum usuário, filho ou atividade.
Não é defeito: é o que `base44 eject` produz (`GOAL.md` §2).
