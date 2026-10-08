# Performance Manager - Makefile
.DEFAULT_GOAL := help

# Configuration variables
PORT ?= 5000
VENV := ./venv
PYTHON := $(VENV)/bin/python3
PIP := $(VENV)/bin/pip
PYTEST := $(VENV)/bin/pytest

# ANSI Color codes for clean output
BLUE   := \033[0;34m
GREEN  := \033[0;32m
YELLOW := \033[1;33m
RED    := \033[0;31m
NC     := \033[0m

.PHONY: help install install-backend install-frontend build build-frontend dev dev-frontend dev-backend start stop restart status logs test test-backend test-frontend test-watch typecheck clean clean-all

help: ## Show this help message
	@echo -e "$(BLUE)Performance Manager - Available Targets:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# --- Installation & Setup ---

$(VENV)/bin/activate:
	@echo -e "$(YELLOW)Creating Python virtual environment...$(NC)"
	@python3 -m venv $(VENV)

install: install-backend install-frontend ## Install all backend and frontend dependencies

install-backend: $(VENV)/bin/activate ## Setup virtualenv and install backend requirements
	@echo -e "$(YELLOW)Installing Python backend dependencies...$(NC)"
	@$(PIP) install --upgrade pip > /dev/null
	@$(PIP) install -r backend/requirements.txt
	@echo -e "$(GREEN)Backend dependencies installed.$(NC)"

install-frontend: ## Install frontend npm dependencies
	@echo -e "$(YELLOW)Installing frontend dependencies...$(NC)"
	@cd frontend && npm install
	@echo -e "$(GREEN)Frontend dependencies installed.$(NC)"

# --- Build ---

build: build-frontend ## Build production frontend distribution

build-frontend: ## Build frontend assets into frontend/dist
	@echo -e "$(BLUE)Building frontend production bundle...$(NC)"
	@cd frontend && npm run build
	@echo -e "$(GREEN)Build completed successfully.$(NC)"

# --- Execution & Lifecycle ---

start: ## Start server in background (usage: make start [PORT=5000])
	@./quick-start.sh start $(PORT)

stop: ## Stop the running server
	@./quick-start.sh stop

restart: ## Restart server (usage: make restart [PORT=5000])
	@./quick-start.sh restart $(PORT)

status: ## Check whether the server is running
	@./quick-start.sh status

logs: ## Tail recent server logs
	@./quick-start.sh logs

# --- Development ---

dev: ## Start development mode (frontend with Vite hot-reload & backend)
	@./quick-start.sh dev

dev-frontend: ## Run frontend Vite development server directly
	@cd frontend && npm run dev

dev-backend: $(VENV)/bin/activate ## Run Flask backend server in debug mode directly
	@PYTHONPATH=backend $(PYTHON) backend/app.py --port $(PORT) --debug

# --- Testing & Quality ---

test: test-backend test-frontend ## Run all test suites (Pytest + Vitest)

test-backend: ## Run Python backend tests (Pytest)
	@echo -e "$(BLUE)Running backend tests...$(NC)"
	@$(PYTEST) backend/

test-frontend: ## Run frontend tests once (Vitest)
	@echo -e "$(BLUE)Running frontend tests...$(NC)"
	@cd frontend && npx vitest run

test-watch: ## Run frontend tests in interactive watch mode
	@cd frontend && npx vitest

typecheck: ## Run TypeScript type verification (vue-tsc)
	@echo -e "$(BLUE)Typechecking frontend...$(NC)"
	@cd frontend && npx vue-tsc --noEmit
	@echo -e "$(GREEN)TypeScript typecheck passed.$(NC)"

# --- Cleanup ---

clean: ## Clean build artifacts and bytecode caches
	@echo -e "$(YELLOW)Cleaning build artifacts and pycache...$(NC)"
	@rm -rf frontend/dist
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@echo -e "$(GREEN)Clean completed.$(NC)"

clean-all: clean ## Clean dependencies, venv, and build artifacts
	@echo -e "$(RED)Removing node_modules and Python venv...$(NC)"
	@rm -rf frontend/node_modules
	@rm -rf $(VENV)
	@echo -e "$(GREEN)Deep clean completed.$(NC)"
