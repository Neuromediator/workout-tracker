import json
from pathlib import Path
from sqlmodel import Session, select
from app.database import engine
from app.models.exercise import Exercise


def seed_exercises():
    with Session(engine) as session:
        seed_path = Path(__file__).parent / "exercises.json"
        exercises = json.loads(seed_path.read_text())

        existing = session.exec(select(Exercise).where(Exercise.is_custom == False)).first()  # noqa: E712
        if not existing:
            # First-time seed
            for data in exercises:
                session.add(Exercise(**data))
            session.commit()
            return

        # Update existing exercises with image_url
        for data in exercises:
            ex = session.exec(
                select(Exercise).where(
                    Exercise.name == data["name"],
                    Exercise.is_custom == False,  # noqa: E712
                )
            ).first()
            if ex and data.get("image_url") and ex.image_url != data["image_url"]:
                ex.image_url = data["image_url"]
                session.add(ex)

        session.commit()
