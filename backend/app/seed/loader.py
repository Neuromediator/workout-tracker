import json
from pathlib import Path
from sqlmodel import Session, select
from app.database import engine
from app.models.exercise import Exercise


def seed_exercises():
    with Session(engine) as session:
        existing = session.exec(select(Exercise).where(Exercise.is_custom == False)).first()
        if existing:
            return

        seed_path = Path(__file__).parent / "exercises.json"
        exercises = json.loads(seed_path.read_text())
        for data in exercises:
            session.add(Exercise(**data))
        session.commit()
