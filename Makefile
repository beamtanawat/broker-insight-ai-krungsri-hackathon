.DEFAULT_GOAL := help

.PHONY: help dev dev-backend dev-frontend setup seed train test lint build docker-up docker-down docker-clean

help: ## Show this help message
	@echo "Broker Insight AI — Development Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: ## First-time setup: copy .env.example, install deps
	@[ -f .env ] || cp .env.example .env && echo "✓ .env created — add your GOOGLE_API_KEY"
	cd backend && python -m venv .venv && .venv/bin/pip install -r requirements.txt
	cd frontend && npm install
	@echo "✓ Setup complete. Run 'make dev' to start."

dev: ## Start all services in Docker (recommended)
	docker compose up --build

dev-backend: ## Start backend only (hot reload, needs Postgres running)
	cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000

dev-frontend: ## Start frontend only (needs backend running)
	cd frontend && npm run dev

seed: ## Seed the database with demo users and synthetic customers
	cd backend && .venv/bin/python -m app.core.seed

train: ## Generate synthetic data and train LightGBM model
	cd backend && .venv/bin/python -m app.ml.generate_data
	cd backend && .venv/bin/python -m app.ml.train_model

migrate: ## Run Alembic migrations
	cd backend && .venv/bin/alembic upgrade head

migration: ## Create a new Alembic migration (usage: make migration MSG="add field")
	cd backend && .venv/bin/alembic revision --autogenerate -m "$(MSG)"

test: ## Run all tests
	cd backend && .venv/bin/pytest tests/ -v
	cd frontend && npm run build

lint: ## Lint all code
	cd backend && .venv/bin/ruff check app/
	cd frontend && npm run lint

build: ## Build production Docker images
	docker compose build

docker-up: ## Start all Docker services (detached)
	docker compose up -d

docker-down: ## Stop all Docker services
	docker compose down

docker-clean: ## Stop and remove all volumes (WARNING: deletes all data)
	docker compose down -v
	@echo "✓ All volumes removed."

logs: ## Follow logs from all services
	docker compose logs -f

shell-backend: ## Open a shell in the backend container
	docker compose exec backend /bin/bash

shell-db: ## Open psql in the database container
	docker compose exec db psql -U broker_user -d broker_insight
