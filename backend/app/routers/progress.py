from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.database import get_session
from app.auth.supabase import ensure_user_exists
from app.services.progress_service import (
    get_summary,
    get_weekly_counts,
    get_exercise_trend,
    get_personal_bests,
)

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.get("/summary")
def progress_summary(
    user_id: str = Depends(ensure_user_exists),
    session: Session = Depends(get_session),
) -> dict:
    return get_summary(user_id, session)


@router.get("/weekly")
def progress_weekly(
    weeks: int = 12,
    user_id: str = Depends(ensure_user_exists),
    session: Session = Depends(get_session),
) -> list[dict]:
    return get_weekly_counts(user_id, session, weeks)


@router.get("/personal-bests")
def progress_personal_bests(
    user_id: str = Depends(ensure_user_exists),
    session: Session = Depends(get_session),
) -> list[dict]:
    return get_personal_bests(user_id, session)


@router.get("/exercise/{exercise_id}")
def progress_exercise(
    exercise_id: str,
    user_id: str = Depends(ensure_user_exists),
    session: Session = Depends(get_session),
) -> list[dict]:
    return get_exercise_trend(user_id, exercise_id, session)
