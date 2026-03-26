"""Predefined routine templates seeded on first startup."""
from sqlmodel import Session, select

from app.database import engine
from app.models.exercise import Exercise
from app.models.routine import Routine, RoutineExercise

SYSTEM_USER_ID = "system"

TEMPLATES = [
    {
        "name": "Push Day",
        "exercises": [
            ("Barbell Bench Press", 4, 8),
            ("Incline Dumbbell Press", 3, 10),
            ("Cable Crossover", 3, 12),
            ("Overhead Press", 3, 10),
            ("Lateral Raise", 3, 15),
            ("Tricep Pushdown", 3, 12),
        ],
    },
    {
        "name": "Pull Day",
        "exercises": [
            ("Pull-Up", 4, 8),
            ("Barbell Row", 4, 8),
            ("Lat Pulldown", 3, 10),
            ("Seated Cable Row", 3, 10),
            ("Face Pull", 3, 15),
            ("Barbell Curl", 3, 10),
        ],
    },
    {
        "name": "Leg Day",
        "exercises": [
            ("Barbell Back Squat", 4, 8),
            ("Romanian Deadlift", 3, 10),
            ("Leg Press", 3, 12),
            ("Leg Curl", 3, 12),
            ("Leg Extension", 3, 12),
            ("Calf Raise", 4, 15),
        ],
    },
    {
        "name": "Full Body",
        "exercises": [
            ("Barbell Back Squat", 3, 8),
            ("Barbell Bench Press", 3, 8),
            ("Barbell Row", 3, 8),
            ("Overhead Press", 3, 10),
            ("Romanian Deadlift", 3, 10),
            ("Plank", 3, 10),
        ],
    },
    {
        "name": "Upper Body",
        "exercises": [
            ("Barbell Bench Press", 4, 8),
            ("Pull-Up", 4, 8),
            ("Overhead Press", 3, 10),
            ("Dumbbell Row", 3, 10),
            ("Lateral Raise", 3, 15),
            ("Barbell Curl", 3, 10),
            ("Tricep Pushdown", 3, 12),
        ],
    },
    {
        "name": "Lower Body",
        "exercises": [
            ("Barbell Back Squat", 4, 8),
            ("Romanian Deadlift", 4, 10),
            ("Leg Press", 3, 12),
            ("Walking Lunge", 3, 12),
            ("Leg Curl", 3, 12),
            ("Calf Raise", 4, 15),
        ],
    },
]


def seed_templates():
    with Session(engine) as session:
        existing = session.exec(
            select(Routine).where(Routine.is_template == True)  # noqa: E712
        ).first()
        if existing:
            return

        # Build name→id lookup for seed exercises
        exercises = session.exec(
            select(Exercise).where(Exercise.is_custom == False)  # noqa: E712
        ).all()
        name_to_id = {e.name: e.id for e in exercises}

        for tmpl in TEMPLATES:
            routine = Routine(
                name=tmpl["name"],
                user_id=SYSTEM_USER_ID,
                is_template=True,
            )
            session.add(routine)
            session.flush()

            for order, (ex_name, sets, reps) in enumerate(tmpl["exercises"]):
                exercise_id = name_to_id.get(ex_name)
                if not exercise_id:
                    continue
                re = RoutineExercise(
                    routine_id=routine.id,
                    exercise_id=exercise_id,
                    order=order,
                    target_sets=sets,
                    target_reps=reps,
                )
                session.add(re)

        session.commit()
