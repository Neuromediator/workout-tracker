import uuid
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship


class ExerciseSet(SQLModel, table=True):
    __tablename__ = "exercise_set"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    session_exercise_id: str = Field(foreign_key="session_exercise.id", index=True)
    set_number: int
    reps: int = 0
    weight: float = 0.0
    rest_seconds: int = 0
    notes: str = ""

    session_exercise: "SessionExercise" = Relationship(back_populates="sets")


class SessionExercise(SQLModel, table=True):
    __tablename__ = "session_exercise"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    session_id: str = Field(foreign_key="workout_session.id", index=True)
    exercise_id: str = Field(foreign_key="exercise.id")
    order: int = 0

    session: "WorkoutSession" = Relationship(back_populates="exercises")
    sets: list[ExerciseSet] = Relationship(back_populates="session_exercise")


class WorkoutSession(SQLModel, table=True):
    __tablename__ = "workout_session"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(index=True)
    routine_id: str | None = Field(default=None, foreign_key="routine.id")
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: datetime | None = None
    notes: str = ""

    exercises: list[SessionExercise] = Relationship(back_populates="session")
