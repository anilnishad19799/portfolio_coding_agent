.PHONY: help dev prod ngrok stop logs clean build

# Default target
.DEFAULT_GOAL := help

## help: Show this help message
help:
	@echo ""
	@echo "  Portfolio – Available Commands"
	@echo "  ──────────────────────────────────────────"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## /  /'
	@echo ""

## dev: Start local development server (with live-reload via volume mount)
dev:
	docker compose up --build -d web api
	@echo "✅  Dev server running at http://localhost:8080"

## prod: Build and start production containers
prod:
	docker compose up --build -d
	@echo "✅  Production stack running at http://localhost:8080"

## ngrok: Start ngrok tunnel (requires NGROK_AUTHTOKEN in .env)
ngrok:
	docker compose up -d ngrok
	@echo "✅  Ngrok dashboard at http://localhost:4040"

## stop: Stop all running containers
stop:
	docker compose down
	@echo "🛑  All containers stopped"

## logs: Tail container logs
logs:
	docker compose logs -f

## clean: Stop containers and remove volumes/images
clean:
	docker compose down --rmi local --volumes --remove-orphans
	@echo "🧹  Cleaned up containers, images, and volumes"

## build: Rebuild all images without cache
build:
	docker compose build --no-cache
	@echo "🔨  Images rebuilt from scratch"
