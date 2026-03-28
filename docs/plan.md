# Workout Tracker - Technical Plan

## 1. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React SPA (Vite) + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | FastAPI + Python |
| ORM / Models | SQLModel (Pydantic + SQLAlchemy unified) |
| Database | SQLite (file-based) |
| Auth | Supabase Auth (managed) |
| AI | LiteLLM → OpenRouter → Cerebras (openrouter/openai/gpt-oss-120b), structured outputs via Pydantic |
| Testing | pytest + httpx (unit/integration), Playwright (E2E) |
| Python tooling | uv |
| Frontend tooling | npm |
| Containerization | Docker + Docker Compose |
| Deployment | Oracle Cloud Free Tier (single VM, always-free ARM instance) |

## 2. Project Structure

```
workout-tracker/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, mounts static files
│   │   ├── config.py            # Settings, env vars
│   │   ├── database.py          # SQLite engine, session
│   │   ├── models/              # SQLModel models (DB + API schemas)
│   │   │   ├── exercise.py
│   │   │   ├── routine.py
│   │   │   ├── session.py
│   │   │   └── user.py
│   │   ├── routers/             # API route handlers
│   │   │   ├── auth.py
│   │   │   ├── exercises.py
│   │   │   ├── routines.py
│   │   │   ├── sessions.py
│   │   │   ├── progress.py
│   │   │   └── ai.py
│   │   ├── services/            # Business logic
│   │   │   ├── ai_service.py    # LiteLLM calls, structured outputs
│   │   │   └── progress_service.py
│   │   ├── seed/                # Exercise library seed data
│   │   │   └── exercises.json
│   │   └── auth/                # Supabase JWT verification
│   │       └── supabase.py
│   ├── tests/
│   │   ├── test_exercises.py
│   │   ├── test_sessions.py
│   │   └── test_ai.py
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/                 # Fetch wrappers per resource
│   │   ├── components/          # Shared UI components
│   │   ├── pages/               # Route-level views
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Exercises.tsx
│   │   │   ├── RoutineBuilder.tsx
│   │   │   ├── ActiveSession.tsx
│   │   │   ├── History.tsx
│   │   │   └── Progress.tsx
│   │   ├── features/
│   │   │   └── ai-sidebar/      # AI chat panel
│   │   ├── hooks/               # Custom hooks (useAuth, useFetch, etc.)
│   │   └── lib/                 # Supabase client, utils
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── Dockerfile
├── e2e/                         # Playwright E2E tests
│   └── workout-flow.spec.ts
├── docker-compose.yml
├── docker-compose.dev.yml
├── docs/
│   ├── product_scope.md
│   └── plan.md
└── CLAUDE.md
```

## 3. Data Models

### Exercise
- id, name, description, muscle_group, tags (JSON), image_url (nullable), is_custom (bool)

### Routine
- id, user_id, name, is_template (bool)
- routine_exercises: exercise_id, order, target_sets, target_reps

### WorkoutSession
- id, user_id, routine_id (nullable), started_at, completed_at, notes

### SessionExercise
- id, session_id, exercise_id, order

### ExerciseSet
- id, session_exercise_id, set_number, reps, weight, notes

### User (Supabase-managed, local reference)
- id (Supabase UUID), ai_enabled (bool)

## 4. API Routes

```
POST   /api/auth/callback          # Supabase auth token verification

GET    /api/exercises               # List/search exercises
GET    /api/exercises/{id}          # Exercise detail

GET    /api/routines                # User's routines + templates
POST   /api/routines                # Create routine
PUT    /api/routines/{id}           # Update routine
DELETE /api/routines/{id}           # Delete routine

POST   /api/sessions               # Start session (from routine or ad-hoc)
GET    /api/sessions                # List past sessions
GET    /api/sessions/{id}           # Session detail
PUT    /api/sessions/{id}           # Update session (add sets, complete)
DELETE /api/sessions/{id}           # Delete session

GET    /api/progress/summary        # Workouts per week/month, total stats
GET    /api/progress/weekly         # Workouts per week for last N weeks (chart data)
GET    /api/progress/personal-bests # Heaviest weight per exercise
GET    /api/progress/exercise/{id}  # Weight/reps trend for exercise

POST   /api/ai/chat                 # AI sidebar message → structured action
PUT    /api/user/settings           # Toggle AI on/off
```

## 5. AI Integration

### Architecture
User message → FastAPI `/api/ai/chat` → LiteLLM (structured output) → parse Pydantic action → execute against DB → return result + summary

### Environment Variables
The `.env` file in the project root contains:
- `OPENROUTER_API_KEY` — required for AI features

### Implementation
```python
from litellm import completion

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

response = completion(
    model=MODEL,
    messages=messages,
    response_format=WorkoutAction,  # Pydantic model
    reasoning_effort="low",
    extra_body=EXTRA_BODY,
)
```

### Action Schema (Pydantic)
```python
class WorkoutAction(BaseModel):
    action: Literal["create_session", "edit_session", "delete_session"]
    requires_confirmation: bool
    summary: str
    session_data: Optional[SessionCreate]
    session_id: Optional[str]
```

### Rules
- Delete actions always set `requires_confirmation: True`
- Frontend shows confirmation dialog before executing destructive actions
- AI errors degrade gracefully — show error message in sidebar, never block core app

## 6. Auth Flow

1. Frontend uses Supabase JS SDK for login/signup UI
2. Supabase returns JWT access token
3. Frontend sends JWT in `Authorization: Bearer <token>` header
4. FastAPI middleware verifies JWT using Supabase's public JWKS
5. User ID extracted from token, used for all DB queries

## 7. Testing Strategy

Only high-value tests — no boilerplate coverage.

### Unit Tests (pytest)
- Pydantic model validation (exercise, routine, session schemas)
- AI response parsing and action dispatch logic
- Progress calculation (weekly/monthly aggregation, personal bests)

### Integration Tests (pytest + httpx)
- Full API endpoint tests against in-memory SQLite
- Auth middleware with mock JWT tokens
- Session lifecycle: create → add exercises → log sets → complete

### E2E Tests (Playwright)
- Login → start workout from routine → log sets → complete → verify in history
- Ad-hoc session flow
- AI sidebar: send message → confirm action → verify result

### Commands
```bash
# Unit + integration tests
cd backend && uv run pytest

# Single test file
cd backend && uv run pytest tests/test_sessions.py

# E2E tests
cd e2e && npx playwright test
```

## 8. Development Workflow

```bash
# Backend
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev    # Vite dev server with proxy to :8000

# Both via Docker Compose (dev mode with hot reload)
docker compose -f docker-compose.dev.yml up
```

## 9. Deployment

### Oracle Cloud Free Tier Setup
- ARM instance (Ampere A1): 4 CPU, 24GB RAM (always-free)
- Docker + Docker Compose installed on VM
- Single container: FastAPI serves API + built React static files
- SQLite file on persistent block storage
- HTTPS via Caddy or nginx reverse proxy with Let's Encrypt

### Production Docker
```dockerfile
# Multi-stage: build frontend, copy into backend image
# Final image runs: uvicorn app.main:app --host 0.0.0.0 --port 8000
# FastAPI mounts frontend/dist as static files at /
```

### Deploy Process
```bash
ssh oracle-vm
cd workout-tracker
git pull
docker compose up --build -d
```

## 10. Implementation Phases

### Phase 1: Foundation ✅
- Project scaffolding (uv, Vite, Docker Compose)
- SQLModel models + SQLite database setup
- Supabase Auth integration (backend JWT verification + frontend login)
- Exercise library seed data

### Phase 2: Core Workout Features ✅
- Exercise library API + UI (list, search, filter)
- Routine builder (create, edit, reorder exercises, set targets)
- Predefined routine templates (Push/Pull/Legs, Full Body, Upper/Lower)

### Phase 3: Workout Logging ✅
- Start session (from routine or ad-hoc)
- Active session UI (log sets/reps/weight, add exercises mid-workout)
- Complete session → save to history
- Exercise images: downloaded from wger.de API, served as static files via `/static/exercises/`
- Database migration support (auto ALTER TABLE for new columns)

### Phase 4: History & Progress ✅
- Session history list + detail view (inline expand)
- Reuse past session as starting point (clones structure with last weights)
- Progress dashboard (workouts per week/month via recharts, exercise trends, personal bests)

### Phase 5: AI Sidebar
- LiteLLM + Cerebras integration with structured outputs
- AI chat UI (sidebar on desktop, drawer on mobile)
- AI actions: create/edit/delete sessions with confirmation
- AI toggle (on/off preference saved per user)

### Phase 6: Production Readiness
- Docker production build (single container)
- Oracle Cloud VM deployment
- HTTPS setup
- Integration + E2E tests for critical flows
