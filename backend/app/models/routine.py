import uuid
from sqlmodel import SQLModel, Field, Relationship


class RoutineExercise(SQLModel, table=True):
    __tablename__ = "routine_exercise"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    routine_id: str = Field(foreign_key="routine.id", index=True)
    exercise_id: str = Field(foreign_key="exercise.id")
    order: int = 0
    target_sets: int = 3
    target_reps: int = 10

    routine: "Routine" = Relationship(back_populates="routine_exercises")


class Routine(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(index=True)
    name: str
    is_template: bool = Field(default=False)

    routine_exercises: list[RoutineExercise] = Relationship(back_populates="routine")
