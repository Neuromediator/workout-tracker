from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from app.config import get_settings
from app.database import create_db_and_tables
from app.seed.loader import seed_exercises
from app.seed.templates import seed_templates
from app.routers import exercises, routines, sessions, progress, ai


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    seed_exercises()
    seed_templates()
    yield


settings = get_settings()

app = FastAPI(title="Workout Tracker API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exercise images and other backend static assets
app.mount("/static", StaticFiles(directory=str(Path(__file__).parent / "static")), name="static")

app.include_router(exercises.router)
app.include_router(routines.router)
app.include_router(sessions.router)
app.include_router(progress.router)
app.include_router(ai.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


# --- SPA serving (production) ---
# In production, the built frontend is copied to /app/frontend_dist
# Serve it as static files with a fallback to index.html for client-side routing
_frontend_dist = Path(__file__).parent.parent / "frontend_dist"
if _frontend_dist.is_dir():
    app.mount("/assets", StaticFiles(directory=str(_frontend_dist / "assets")), name="frontend_assets")

    @app.get("/{full_path:path}")
    async def spa_fallback(request: Request, full_path: str):
        """Serve frontend files, fallback to index.html for SPA routing."""
        file_path = _frontend_dist / full_path
        if full_path and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(_frontend_dist / "index.html")
