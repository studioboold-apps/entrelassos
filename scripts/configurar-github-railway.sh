#!/usr/bin/env bash
# Cadastra no GitHub o que o workflow `ci-deploy` precisa para publicar no
# Railway: o ambiente `production`, o segredo RAILWAY_TOKEN e, se houver, a
# variavel RAILWAY_PUBLIC_URL.
#
# O token NUNCA entra como argumento de linha de comando (ficaria no historico
# do shell e na lista de processos): ele vem de um ARQUIVO ou e' digitado sem
# eco, e vai direto para o `gh` pela entrada padrao.
#
# Uso:
#   scripts/configurar-github-railway.sh                      # pede o token
#   scripts/configurar-github-railway.sh --token-file caminho  # le de arquivo
#   scripts/configurar-github-railway.sh --url https://...     # + URL publica
#   scripts/configurar-github-railway.sh --repo dono/repo      # outro repo
#
# Requer o GitHub CLI autenticado com permissao de admin no repo (`gh auth login`).
set -euo pipefail

REPO="studioboold-apps/entrelassos"
ENVIRONMENT="production"
TOKEN_FILE=""
PUBLIC_URL=""

while [ $# -gt 0 ]; do
  case "$1" in
    --repo) REPO="$2"; shift 2 ;;
    --env) ENVIRONMENT="$2"; shift 2 ;;
    --token-file) TOKEN_FILE="$2"; shift 2 ;;
    --url) PUBLIC_URL="$2"; shift 2 ;;
    -h|--help) sed -n '2,17p' "$0"; exit 0 ;;
    *) echo "argumento desconhecido: $1" >&2; exit 2 ;;
  esac
done

command -v gh >/dev/null || { echo "instale o GitHub CLI: https://cli.github.com" >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "rode 'gh auth login' antes" >&2; exit 1; }

if [ -n "$TOKEN_FILE" ]; then
  TOKEN="$(head -n1 "$TOKEN_FILE" | tr -d '[:space:]')"
else
  printf 'Token de PROJETO do Railway (ambiente %s): ' "$ENVIRONMENT" >&2
  IFS= read -rs TOKEN
  echo >&2
fi
[ -n "$TOKEN" ] || { echo "token vazio" >&2; exit 1; }

echo "-> ambiente '$ENVIRONMENT' em $REPO"
gh api --silent -X PUT "repos/$REPO/environments/$ENVIRONMENT"

echo "-> segredo RAILWAY_TOKEN"
printf '%s' "$TOKEN" | gh secret set RAILWAY_TOKEN --repo "$REPO" --env "$ENVIRONMENT"
unset TOKEN

if [ -n "$PUBLIC_URL" ]; then
  echo "-> variavel RAILWAY_PUBLIC_URL = $PUBLIC_URL"
  gh variable set RAILWAY_PUBLIC_URL --repo "$REPO" --env "$ENVIRONMENT" --body "$PUBLIC_URL"
fi

echo "pronto. Conferir: gh secret list --repo $REPO --env $ENVIRONMENT"
