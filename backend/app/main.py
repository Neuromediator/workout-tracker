from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
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


app = FastAPI(title="Workout Tracker API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=str(Path(__file__).parent / "static")), name="static")

app.include_router(exercises.router)
app.include_router(routines.router)
app.include_router(sessions.router)
app.include_router(progress.router)
app.include_router(ai.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
