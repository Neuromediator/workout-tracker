# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Workout Tracker is a personal single-user web app for planning workouts, logging sessions, and tracking progress. Product scope: `docs/product_scope.md`. Technical plan: `docs/plan.md`.

## Tech Stack

- **Frontend:** React SPA (Vite) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** FastAPI + Python + SQLModel + Pydantic
- **Database:** SQLite (file-based)
- **Auth:** Supabase Auth (JWT verified in FastAPI middleware)
- **AI:** LiteLLM → OpenRouter → Cerebras (`openrouter/openai/gpt-oss-120b`), structured outputs via Pydantic
- **State management:** `useState`/`useContext` + plain fetch wrappers — no TanStack Query or Zustand
- **Testing:** pytest + httpx (unit/integration), Playwright (E2E) — only high-value tests
- **Python tooling:** uv
- **Deployment:** Docker → Oracle Cloud Free Tier (single ARM VM)

## Commands

```bash
# Backend
cd backend && uv sync
cd backend && uv run uvicorn app.main:app --reload --port 8000
cd backend && uv run pytest
cd backend && uv run pytest tests/test_sessions.py  # single file

# Frontend
cd frontend && npm install
cd frontend && npm run dev

# E2E tests
cd e2e && npx playwright test

# Dev (both services)
docker compose -f docker-compose.dev.yml up

# Production
docker compose up --build -d
```

## Architecture

- FastAPI serves both the API (`/api/*`) and the built React static files (`/`)
- Single Docker container in production (multi-stage build: frontend → backend)
- SQLModel models serve as both DB schemas and API request/response validation
- AI sidebar uses structured outputs — LLM returns typed Pydantic action objects, backend executes them against DB
- Delete actions from AI always require frontend confirmation

## Product Principles

- Minimize clicks during training — fast logging is the priority
- AI features are always optional and non-blocking; core app works fully without AI
- Mobile-first: large touch targets, vertical scroll optimization, responsive layouts
