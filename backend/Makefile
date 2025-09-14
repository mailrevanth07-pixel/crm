# CRM Backend Makefile
# Provides convenient commands for Docker development and deployment

.PHONY: help build dev prod down logs shell migrate seed setup clean

# Default target
help: ## Show this help message
	@echo "CRM Backend Docker Commands"
	@echo "=========================="
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Build commands
build: ## Build production Docker image
	docker build -t crm-backend .

build-dev: ## Build development Docker image
	docker build -f Dockerfile.dev -t crm-backend-dev .

build-all: ## Build all Docker images
	docker-compose build

# Development commands
dev: ## Start development environment with hot reload
	docker-compose -f docker-compose.dev.yml up --build

dev-detached: ## Start development environment in background
	docker-compose -f docker-compose.dev.yml up --build -d

# Production commands
prod: ## Start production environment
	docker-compose up --build

prod-detached: ## Start production environment in background
	docker-compose up --build -d

# Management commands
down: ## Stop all services
	docker-compose down

down-dev: ## Stop development services
	docker-compose -f docker-compose.dev.yml down

down-volumes: ## Stop services and remove volumes (WARNING: deletes data)
	docker-compose down -v

# Logging commands
logs: ## View production logs
	docker-compose logs -f

logs-dev: ## View development logs
	docker-compose -f docker-compose.dev.yml logs -f

logs-backend: ## View backend logs only
	docker-compose logs -f backend

logs-db: ## View database logs only
	docker-compose logs -f postgres

# Shell access
shell: ## Access production backend container shell
	docker-compose exec backend sh

shell-dev: ## Access development backend container shell
	docker-compose -f docker-compose.dev.yml exec backend sh

shell-db: ## Access database container shell
	docker-compose exec postgres psql -U crm_user -d crm_db

# Database commands
migrate: ## Run database migrations
	docker-compose exec backend npm run migrate

migrate-dev: ## Run database migrations in development
	docker-compose -f docker-compose.dev.yml exec backend npm run migrate

migrate-sync: ## Sync database schema (development only)
	docker-compose -f docker-compose.dev.yml exec backend npm run migrate:sync

seed: ## Run database seed script
	docker-compose exec backend npm run seed:run

seed-dev: ## Run database seed script in development
	docker-compose -f docker-compose.dev.yml exec backend npm run seed:run

setup: ## Setup database (migrate + seed)
	docker-compose exec backend npm run setup

setup-dev: ## Setup database in development (migrate + seed)
	docker-compose -f docker-compose.dev.yml exec backend npm run setup

# Status commands
status: ## Show container status
	docker-compose ps

status-dev: ## Show development container status
	docker-compose -f docker-compose.dev.yml ps

health: ## Check service health
	@echo "Checking backend health..."
	@curl -f http://localhost:3001/health || echo "Backend not responding"
	@echo "Checking socket status..."
	@curl -f http://localhost:3001/socket-status || echo "Socket status not available"

# Testing commands
test: ## Run tests in container
	docker-compose exec backend npm test

test-dev: ## Run tests in development container
	docker-compose -f docker-compose.dev.yml exec backend npm test

# Cleanup commands
clean: ## Remove stopped containers and unused images
	docker system prune -f

clean-all: ## Remove all containers, images, and volumes (WARNING: deletes everything)
	docker-compose down -v --rmi all
	docker system prune -a -f

clean-dev: ## Clean development environment
	docker-compose -f docker-compose.dev.yml down -v

# Backup commands
backup-db: ## Backup database
	docker-compose exec postgres pg_dump -U crm_user crm_db > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Database backed up to backup_$(shell date +%Y%m%d_%H%M%S).sql"

restore-db: ## Restore database from backup (usage: make restore-db BACKUP_FILE=backup.sql)
	docker-compose exec -T postgres psql -U crm_user crm_db < $(BACKUP_FILE)

# Development workflow
start: dev ## Alias for dev command

restart: down dev ## Restart development environment

reset: down-volumes dev setup-dev ## Reset development environment (WARNING: deletes data)

# Production workflow
deploy: build prod setup ## Deploy production environment

# Quick commands
quick-start: ## Quick start for new developers
	@echo "Setting up development environment..."
	@cp env.example .env
	@echo "Please edit .env file with your configuration"
	@echo "Then run: make dev"

# Environment setup
env-setup: ## Copy environment example file
	cp env.example .env
	@echo "Environment file created. Please edit .env with your configuration."

# Show configuration
config: ## Show current Docker configuration
	@echo "Docker Compose Configuration:"
	@docker-compose config

config-dev: ## Show development Docker configuration
	@echo "Development Docker Compose Configuration:"
	@docker-compose -f docker-compose.dev.yml config

