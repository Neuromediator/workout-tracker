from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel

from app.database import get_session
from app.auth.supabase import ensure_user_exists
from app.models.session import WorkoutSession, SessionExercise, ExerciseSet
from app.models.routine import Routine, RoutineExercise

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


# --- Request schemas ---


class SetIn(BaseModel):
    set_number: int
    reps: int = 0
    weight: float = 0.0
    rest_seconds: int = 0
    notes: str = ""


class SessionExerciseIn(BaseModel):
    exercise_id: str
    order: int = 0
    sets: list[SetIn] = []


class SessionCreate(BaseModel):
    routine_id: str | None = None
    notes: str = ""
    exercises: list[SessionExerciseIn] = []


class SessionUpdate(BaseModel):
    notes: str | None = None
    completed_at: datetime | None = None
    exercises: list[SessionExerciseIn] | None = None


class AddExerciseIn(BaseModel):
    exercise_id: str
    order: int = 0


class LogSetIn(BaseModel):
    set_number: int
    reps: int = 0
    weight: float = 0.0
    rest_seconds: int = 0
    notes: str = ""


# --- Response schemas ---


class SetOut(BaseModel):
    id: str
    set_number: int
    reps: int
    weight: float
    rest_seconds: int
    notes: str


class SessionExerciseOut(BaseModel):
    id: str
    exercise_id: str
    order: int
    sets: list[SetOut]


class SessionOut(BaseModel):
    id: str
    user_id: str
    routine_id: str | None
    started_at: datetime
    completed_at: datetime | None
    notes: str
    exercises: list[SessionExerciseOut]


# --- Endpoints ---


@router.post("", status_code=status.HTTP_201_CREATED)
def create_session(
    data: SessionCreate,
    user_id: str = Depends(ensure_user_exists),
    session: Session = Depends(get_session),
) -> SessionOut:
    """Start a new workout session, optionally from a routine."""
    ws = WorkoutSession(
        user_id=user_id,
        routine_id=data.routine_id,
        notes=data.notes,
    )
    session.add(ws)
    session.flush()

    if data.routine_id and not data.exercises:
        # Pre-populate from routine
        routine = session.get(Routine, data.routine_id)
        if routine:
            r_exercises = session.exec(
                select(RoutineExercise)
                .where(RoutineExercise.routine_id == data.routine_id)
                .order_by(RoutineExercise.order)
            ).all()
            for re in r_exercises:
                se = SessionExercise(
                    session_id=ws.id,
                    exercise_id=re.exercise_id,
                    order=re.order,
                )
                session.add(se)
                session.flush()
                # Create empty sets based on routine targets
                for i in range(1, re.target_sets + 1):
                    es = ExerciseSet(
                        session_exercise_id=se.id,
                        set_number=i,
                        reps=0,
                        weight=0.0,
                    )
                    session.add(es)
    else:
        for ex_in in data.exercises:
            se = SessionExercise(
                session_id=ws.id,
                exercise_id=ex_in.exercise_id,
                order=ex_in.order,
            )
            session.add(se)
            session.flush()
            for s in ex_in.sets:
                es = ExerciseSet(
                    session_exercise_id=se.id,
                    set_number=s.set_number,
                    reps=s.reps,
                    weight=s.weight,
                    rest_seconds=s.rest_seconds,
                    notes=s.notes,
                )
                session.add(es)

    session.commit()
    session.refresh(ws)
    return SessionOut.model_validate(ws, from_attributes=True)


@router.get("")
def list_sessions(
    user_id: str = Depends(ensure_user_exists),
    session: Session = Depends(get_session),
) -> list[SessionOut]:
    query = (
        select(WorkoutSession)
        .where(WorkoutSession.user_id == user_id)
        .order_by(WorkoutSession.started_at.desc())  # type: ignore[union-attr]
    )
    sessions = session.exec(query).all()
    return [SessionOut.model_validate(s, from_attributes=True) for s in sessions]


@router.get("/{session_id}")
def get_session_detail(
    session_id: str,
    user_id: str = Depends(ensure_user_exists),
    session: Session = Depends(get_session),
) -> SessionOut:
    ws = session.get(WorkoutSession, session_id)
    if not ws:
        raise HTTPException(status_code=404, detail="Session not found")
    if ws.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your session")
    return SessionOut.model_validate(ws, from_attributes=True)


@router.post("/{session_id}/exercises", status_code=status.HTTP_201_CREATED)
def add_exercise_to_session(
    session_id: str,
    data: AddExerciseIn,
    user_id: str = Depends(ensure_user_exists),
    session: Session = Depends(get_session),
) -> SessionOut:
    """Add an exercise mid-workout."""
    ws = session.get(WorkoutSession, session_id)
    if not ws:
        raise HTTPException(status_code=404, detail="Session not found")
    if ws.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your session")

    # Auto-determine order
    existing = session.exec(
        select(SessionExercise).where(SessionExercise.session_id == session_id)
    ).all()
    order = max((e.order for e in existing), default=-1) + 1

    se = SessionExercise(
        session_id=session_id,
        exercise_id=data.exercise_id,
        order=data.order if data.order > 0 else order,
    )
    session.add(se)
    session.flush()

    # Add one empty set by default
    es = ExerciseSet(
        session_exercise_id=se.id,
        set_number=1,
        reps=0,
        weight=0.0,
    )
    session.add(es)

    session.commit()
    session.refresh(ws)
    return SessionOut.model_validate(ws, from_attributes=True)


@router.post("/{session_id}/exercises/{session_exercise_id}/sets")
def log_set(
    session_id: str,
    session_exercise_id: str,
    data: LogSetIn,
    user_id: str = Depends(ensure_user_exists),
    session: Session = Depends(get_session),
) -> SessionOut:
    """Log or update a set for an exercise in the active session."""
    ws = session.get(WorkoutSession, session_id)
    if not ws:
        raise HTTPException(status_code=404, detail="Session not found")
    if ws.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your session")

    se = session.get(SessionExercise, session_exercise_id)
    if not se or se.session_id != session_id:
        raise HTTPException(status_code=404, detail="Exercise not in session")

    # Check if set already exists (update) or create new
    existing_set = session.exec(
        select(ExerciseSet).where(
            ExerciseSet.session_exercise_id == session_exercise_id,
            ExerciseSet.set_number == data.set_number,
        )
    ).first()

    if existing_set:
        existing_set.reps = data.reps
        existing_set.weight = data.weight
        existing_set.rest_seconds = data.rest_seconds
        existing_set.notes = data.notes
        session.add(existing_set)
    else:
        es = ExerciseSet(
            session_exercise_id=session_exercise_id,
            set_number=data.set_number,
            reps=data.reps,
            weight=data.weight,
            rest_seconds=data.rest_seconds,
            notes=data.notes,
        )
        session.add(es)

    session.commit()
    session.refresh(ws)
    return SessionOut.model_validate(ws, from_attributes=True)


@router.put("/{session_id}/complete")
def complete_session(
    session_id: str,
    user_id: str = Depends(ensure_user_exists),
    session: Session = Depends(get_session),
) -> SessionOut:
    """Mark session as completed."""
    ws = session.get(WorkoutSession, session_id)
    if not ws:
        raise HTTPException(status_code=404, detail="Session not found")
    if ws.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your session")

    ws.completed_at = datetime.utcnow()
    session.add(ws)
    session.commit()
    session.refresh(ws)
    return SessionOut.model_validate(ws, from_attributes=True)


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: str,
    user_id: str = Depends(ensure_user_exists),
    session: Session = Depends(get_session),
):
    ws = session.get(WorkoutSession, session_id)
    if not ws:
        raise HTTPException(status_code=404, detail="Session not found")
    if ws.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your session")

    # Delete sets → session exercises → session
    for se in ws.exercises:
        for s in se.sets:
            session.delete(s)
        session.delete(se)
    session.delete(ws)
    session.commit()
