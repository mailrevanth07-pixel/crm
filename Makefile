# CRM Full Stack Makefile
# Provides convenient commands for Docker development and deployment

.PHONY: help dev prod down logs shell migrate seed setup clean

# Default target
help: ## Show this help message
	@echo "CRM Full Stack Docker Commands"
	@echo "=============================="
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development commands
dev: ## Start full stack development environment
	docker-compose -f docker-compose.full.yml up --build

dev-detached: ## Start full stack development environment in background
	docker-compose -f docker-compose.full.yml up --build -d

# Production commands
prod: ## Start full stack production environment
	docker-compose -f docker-compose.prod.full.yml up --build

prod-detached: ## Start full stack production environment in background
	docker-compose -f docker-compose.prod.full.yml up --build -d

# Management commands
down: ## Stop all services
	docker-compose -f docker-compose.full.yml down

down-prod: ## Stop production services
	docker-compose -f docker-compose.prod.full.yml down

down-volumes: ## Stop services and remove volumes (WARNING: deletes data)
	docker-compose -f docker-compose.full.yml down -v

# Logging commands
logs: ## View development logs
	docker-compose -f docker-compose.full.yml logs -f

logs-prod: ## View production logs
	docker-compose -f docker-compose.prod.full.yml logs -f

logs-backend: ## View backend logs only
	docker-compose -f docker-compose.full.yml logs -f backend

logs-frontend: ## View frontend logs only
	docker-compose -f docker-compose.full.yml logs -f frontend

logs-redis: ## View redis logs only
	docker-compose -f docker-compose.full.yml logs -f redis

# Shell access
shell-backend: ## Access backend container shell
	docker-compose -f docker-compose.full.yml exec backend sh

shell-frontend: ## Access frontend container shell
	docker-compose -f docker-compose.full.yml exec frontend sh

shell-redis: ## Access redis container shell
	docker-compose -f docker-compose.full.yml exec redis sh

# Database commands
migrate: ## Run database migrations
	docker-compose -f docker-compose.full.yml exec backend npm run migrate

migrate-sync: ## Sync database schema (development only)
	docker-compose -f docker-compose.full.yml exec backend npm run migrate:sync

seed: ## Run database seed script
	docker-compose -f docker-compose.full.yml exec backend npm run seed:run

setup: ## Setup database (migrate + seed)
	docker-compose -f docker-compose.full.yml exec backend npm run setup

# Status commands
status: ## Show container status
	docker-compose -f docker-compose.full.yml ps

status-prod: ## Show production container status
	docker-compose -f docker-compose.prod.full.yml ps

health: ## Check service health
	@echo "Checking backend health..."
	@curl -f http://localhost:3001/health || echo "Backend not responding"
	@echo "Checking frontend health..."
	@curl -f http://localhost:3000 || echo "Frontend not responding"
	@echo "Checking socket status..."
	@curl -f http://localhost:3001/socket-status || echo "Socket status not available"

# Cleanup commands
clean: ## Remove stopped containers and unused images
	docker system prune -f

clean-all: ## Remove all containers, images, and volumes (WARNING: deletes everything)
	docker-compose -f docker-compose.full.yml down -v --rmi all
	docker-compose -f docker-compose.prod.full.yml down -v --rmi all
	docker system prune -a -f

# Development workflow
start: dev ## Alias for dev command

restart: down dev ## Restart development environment

reset: down-volumes dev setup ## Reset development environment (WARNING: deletes data)

# Production workflow
deploy: prod setup ## Deploy production environment

# Quick commands
quick-start: ## Quick start for new developers
	@echo "Setting up full stack development environment..."
	@echo "Starting services..."
	@make dev

# Environment setup
env-setup: ## Copy environment example files
	@echo "Creating environment files..."
	@echo "Please create .env files in backend/ and frontend/ directories"
	@echo "Backend .env should contain DATABASE_URL, JWT_SECRET, etc."
	@echo "Frontend .env should contain NEXT_PUBLIC_API_URL"

# Show configuration
config: ## Show current Docker configuration
	@echo "Development Docker Compose Configuration:"
	@docker-compose -f docker-compose.full.yml config

config-prod: ## Show production Docker configuration
	@echo "Production Docker Compose Configuration:"
	@docker-compose -f docker-compose.prod.full.yml config

# Build commands
build: ## Build all Docker images
	docker-compose -f docker-compose.full.yml build

build-prod: ## Build production Docker images
	docker-compose -f docker-compose.prod.full.yml build

# Individual service commands
backend-only: ## Start only backend with Docker
	docker-compose -f docker-compose.full.yml up --build backend redis

frontend-only: ## Start only frontend with Docker
	docker-compose -f docker-compose.full.yml up --build frontend
