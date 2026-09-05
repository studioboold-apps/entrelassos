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

COMPOSE := docker compose --project-name $(PROJECT_NAME)-$(ENV)

.PHONY: help up down logs psql install dev dev-web dev-api build test typecheck validate clean

help: ## lista os alvos
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$'  Makefile | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

up: ## sobe a infra local
	$(COMPOSE) up -d --wait

down: ## derruba a infra local
	$(COMPOSE) down

logs: ## acompanha os logs da infra
	$(COMPOSE) logs -f

psql: ## abre o psql no banco do ambiente
	$(COMPOSE) exec postgres psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)

install: ## instala dependencias de todas as apps
	bun install

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

validate: typecheck test ## portao de qualidade

clean: ## remove build e dependencias
	rm -rf apps/*/dist apps/*/node_modules node_modules
