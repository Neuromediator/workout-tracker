from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel

from app.database import get_session
from app.auth.supabase import ensure_user_exists
from app.models.routine import Routine, RoutineExercise

router = APIRouter(prefix="/api/routines", tags=["routines"])


class RoutineExerciseIn(BaseModel):
    exercise_id: str
    order: int = 0
    target_sets: int = 3
    target_reps: int = 10


class RoutineCreate(BaseModel):
    name: str
    exercises: list[RoutineExerciseIn] = []


class RoutineUpdate(BaseModel):
    name: str | None = None
    exercises: list[RoutineExerciseIn] | None = None


class RoutineExerciseOut(BaseModel):
    id: str
    exercise_id: str
    order: int
    target_sets: int
    target_reps: int


class RoutineOut(BaseModel):
    id: str
    user_id: str
    name: str
    is_template: bool
    routine_exercises: list[RoutineExerciseOut]


@router.get("")
def list_routines(
    user_id: str = Depends(ensure_user_exists),
    session: Session = Depends(get_session),
) -> list[RoutineOut]:
    query = select(Routine).where(
        (Routine.user_id == user_id) | (Routine.is_template == True)  # noqa: E712
    )
    routines = session.exec(query).all()
    return [RoutineOut.model_validate(r, from_attributes=True) for r in routines]


@router.get("/{routine_id}")
def get_routine(
    routine_id: str,
    user_id: str = Depends(ensure_user_exists),
    session: Session = Depends(get_session),
) -> RoutineOut:
    routine = session.get(Routine, routine_id)
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    if routine.user_id != user_id and not routine.is_template:
        raise HTTPException(status_code=403, detail="Not your routine")
    return RoutineOut.model_validate(routine, from_attributes=True)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_routine(
    data: RoutineCreate,
    user_id: str = Depends(ensure_user_exists),
    session: Session = Depends(get_session),
) -> RoutineOut:
    routine = Routine(name=data.name, user_id=user_id)
    session.add(routine)
    session.flush()

    for ex in data.exercises:
        re = RoutineExercise(
            routine_id=routine.id,
            exercise_id=ex.exercise_id,
            order=ex.order,
            target_sets=ex.target_sets,
            target_reps=ex.target_reps,
        )
        session.add(re)

    session.commit()
    session.refresh(routine)
    return RoutineOut.model_validate(routine, from_attributes=True)


@router.put("/{routine_id}")
def update_routine(
    routine_id: str,
    data: RoutineUpdate,
    user_id: str = Depends(ensure_user_exists),
    session: Session = Depends(get_session),
) -> RoutineOut:
    routine = session.get(Routine, routine_id)
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    if routine.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your routine")

    if data.name is not None:
        routine.name = data.name

    if data.exercises is not None:
        # Delete existing exercises and replace
        existing = session.exec(
            select(RoutineExercise).where(RoutineExercise.routine_id == routine_id)
        ).all()
        for e in existing:
            session.delete(e)

        for ex in data.exercises:
            re = RoutineExercise(
                routine_id=routine.id,
                exercise_id=ex.exercise_id,
                order=ex.order,
                target_sets=ex.target_sets,
                target_reps=ex.target_reps,
            )
            session.add(re)

    session.add(routine)
    session.commit()
    session.refresh(routine)
    return RoutineOut.model_validate(routine, from_attributes=True)


@router.delete("/{routine_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_routine(
    routine_id: str,
    user_id: str = Depends(ensure_user_exists),
    session: Session = Depends(get_session),
):
    routine = session.get(Routine, routine_id)
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    if routine.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your routine")

    # Delete routine exercises first
    existing = session.exec(
        select(RoutineExercise).where(RoutineExercise.routine_id == routine_id)
    ).all()
    for e in existing:
        session.delete(e)

    session.delete(routine)
    session.commit()
