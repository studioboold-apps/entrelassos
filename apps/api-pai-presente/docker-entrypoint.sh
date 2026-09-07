#!/bin/sh
# Pai Presente — API
# Copyright (c) 2026. Todos os direitos reservados.
# Licenca: proprietaria.
#
# O volume do Railway e' montado com dono root, e a API roda como `bun`. So root
# muda dono, entao o container sobe como root, ajusta a pasta de midia e cai
# para `bun` antes de atender a primeira requisicao.
set -e

if [ -n "$MEDIA_DIRECTORY" ]; then
  mkdir -p "$MEDIA_DIRECTORY"
  chown -R bun:bun "$MEDIA_DIRECTORY"
fi

exec su-exec bun "$@"
