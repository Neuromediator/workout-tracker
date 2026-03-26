from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select
from pydantic import BaseModel

from app.database import get_session
from app.auth.supabase import ensure_user_exists
from app.models.exercise import Exercise

router = APIRouter(prefix="/api/exercises", tags=["exercises"])


class ExerciseCreate(BaseModel):
    name: str
    description: str = ""
    muscle_group: str
    tags: list[str] = []


class ExerciseUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    muscle_group: str | None = None
    tags: list[str] | None = None


@router.get("")
def list_exercises(
    muscle_group: str | None = Query(None),
    search: str | None = Query(None),
    tag: str | None = Query(None),
    user_id: str = Depends(ensure_user_exists),
    session: Session = Depends(get_session),
) -> list[Exercise]:
    query = select(Exercise).where(
        (Exercise.is_custom == False) | (Exercise.user_id == user_id)  # noqa: E712
    )
    if muscle_group:
        query = query.where(Exercise.muscle_group == muscle_group)
    if search:
        query = query.where(Exercise.name.contains(search))  # type: ignore
    exercises = list(session.exec(query).all())
    if tag:
        exercises = [e for e in exercises if tag in (e.tags or [])]
    return exercises


@router.get("/{exercise_id}")
def get_exercise(
    exercise_id: str,
    user_id: str = Depends(ensure_user_exists),
    session: Session = Depends(get_session),
) -> Exercise:
    exercise = session.get(Exercise, exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    if exercise.is_custom and exercise.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your exercise")
    return exercise


@router.post("", status_code=status.HTTP_201_CREATED)
def create_exercise(
    data: ExerciseCreate,
    user_id: str = Depends(ensure_user_exists),
    session: Session = Depends(get_session),
) -> Exercise:
    exercise = Exercise(
        name=data.name,
        description=data.description,
        muscle_group=data.muscle_group,
        tags=data.tags,
        is_custom=True,
        user_id=user_id,
    )
    session.add(exercise)
    session.commit()
    session.refresh(exercise)
    return exercise


@router.put("/{exercise_id}")
def update_exercise(
    exercise_id: str,
    data: ExerciseUpdate,
    user_id: str = Depends(ensure_user_exists),
    session: Session = Depends(get_session),
) -> Exercise:
    exercise = session.get(Exercise, exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    if not exercise.is_custom or exercise.user_id != user_id:
        raise HTTPException(status_code=403, detail="Can only edit your custom exercises")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(exercise, key, value)
    session.add(exercise)
    session.commit()
    session.refresh(exercise)
    return exercise


@router.delete("/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exercise(
    exercise_id: str,
    user_id: str = Depends(ensure_user_exists),
    session: Session = Depends(get_session),
):
    exercise = session.get(Exercise, exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    if not exercise.is_custom or exercise.user_id != user_id:
        raise HTTPException(status_code=403, detail="Can only delete your custom exercises")
    session.delete(exercise)
    session.commit()
