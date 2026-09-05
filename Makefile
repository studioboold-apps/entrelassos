# Abstrai os comandos do projeto (code-standart.md §4).
# ENV escolhe o arquivo de envs/; PROJECT_NAME sai de lá e prefixa todo recurso.

ENV ?= dev
ENV_FILE := envs/env.$(ENV)
ENV_LOCAL := envs/env.$(ENV).local

ifeq (,$(wildcard $(ENV_FILE)))
$(error $(ENV_FILE) nao existe — ENV=$(ENV) invalido)
endif

include $(ENV_FILE)
export
-include $(ENV_LOCAL)
export

# O docker RECUSA ponto no nome do projeto, e o ENV vem do nome do arquivo
# (`env.test.e2e`). Traduzir aqui e o que deixa `make up ENV=test.e2e` existir
# sem renomear o arquivo de ambiente que a spec nomeia.
COMPOSE_PROJECT := $(PROJECT_NAME)-$(subst .,-,$(ENV))
COMPOSE := docker compose --project-name $(COMPOSE_PROJECT)

.PHONY: help compose-project up down logs psql migrate seed install dev dev-web dev-api build test test-e2e typecheck validate clean

help: ## lista os alvos
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$'  Makefile | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

compose-project: ## imprime o nome do projeto docker do ambiente
	@echo $(COMPOSE_PROJECT)

up: ## sobe a infra local
	$(COMPOSE) up -d --wait

down: ## derruba a infra local
	$(COMPOSE) down

logs: ## acompanha os logs da infra
	$(COMPOSE) logs -f

psql: ## abre o psql no banco do ambiente
	$(COMPOSE) exec postgres psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)

migrate: ## aplica as migrations no banco do ambiente
	cd apps/api-pai-presente && bun run db:migrate

seed: migrate ## popula o banco do ambiente pelos use cases (idempotente)
	cd apps/api-pai-presente && bun run db:seed

install: ## instala dependencias de todas as apps
	bun install

dev: up migrate ## sobe infra, api e web de uma vez (Ctrl-C derruba os dois)
	@trap 'kill 0' EXIT INT TERM; \
	$(MAKE) dev-api & \
	$(MAKE) dev-web & \
	wait

dev-web: ## sobe o frontend
	cd apps/frontend-pai-presente && bun run dev

dev-api: ## sobe a api
	cd apps/api-pai-presente && bun run dev

build: ## build de producao
	cd apps/frontend-pai-presente && bun run build

typecheck: ## checagem de tipos
	cd apps/api-pai-presente && bun run typecheck

test: ## testes
	bun test

test-e2e: ## fumaca ponta a ponta na API de verdade, no banco de env.test.e2e
	$(MAKE) up ENV=test.e2e
	$(MAKE) migrate ENV=test.e2e
	PP_E2E=1 bun test apps/api-pai-presente/src/e2e

validate: typecheck test ## portao de qualidade

clean: ## remove build e dependencias
	rm -rf apps/*/dist apps/*/node_modules node_modules
