from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import create_db_and_tables
from app.seed.loader import seed_exercises
from app.seed.templates import seed_templates
from app.routers import exercises, routines


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

app.include_router(exercises.router)
app.include_router(routines.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
