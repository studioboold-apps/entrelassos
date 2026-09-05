# Contexto de build: a RAIZ do monorepo.
#
# Multi-estagio porque a imagem final nao pode carregar fonte nem dependencia:
# `bun build` fecha tudo num arquivo so, e o que sobe tem o binario do Bun, o
# bundle e as migrations. Sem `node_modules`, sem `.ts`, sem `bun.lock`.
ARG BUN_VERSION=1.3.14

FROM oven/bun:${BUN_VERSION}-alpine AS build
WORKDIR /repo

# Os manifestos primeiro: mexer em codigo nao invalida a camada de instalacao.
COPY package.json bun.lock ./
COPY apps/api-pai-presente/package.json apps/api-pai-presente/
COPY apps/frontend-pai-presente/package.json apps/frontend-pai-presente/
# `--frozen-lockfile` (security.md §4): build reprodutivel, versao igual a testada.
RUN bun install --frozen-lockfile

COPY apps/api-pai-presente apps/api-pai-presente
WORKDIR /repo/apps/api-pai-presente
RUN bun build ./src/main.ts ./src/database/migrate.ts --target=bun --outdir=dist

FROM oven/bun:${BUN_VERSION}-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# O migrador le `./drizzle` a partir do diretorio de trabalho.
COPY --from=build /repo/apps/api-pai-presente/dist ./dist
COPY --from=build /repo/apps/api-pai-presente/drizzle ./drizzle

# `bun` ja existe na imagem oficial e nao e root.
USER bun
EXPOSE 3000
CMD ["bun", "dist/main.js"]
