from datetime import datetime, timedelta
from sqlmodel import Session, select, col
from app.models.session import WorkoutSession, SessionExercise, ExerciseSet
from app.models.exercise import Exercise


def _get_completed_sessions(user_id: str, session: Session) -> list[WorkoutSession]:
    """Fetch all completed sessions for a user (single query, relationships lazy-loaded)."""
    return list(session.exec(
        select(WorkoutSession).where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.completed_at.is_not(None),  # type: ignore[union-attr]
        )
    ).all())


def get_summary(user_id: str, session: Session) -> dict:
    """Aggregate workout stats in a single pass over completed sessions."""
    now = datetime.utcnow()
    week_start = now - timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    completed_sessions = _get_completed_sessions(user_id, session)

    total = len(completed_sessions)
    this_week = 0
    this_month = 0
    total_sets = 0
    total_volume = 0.0

    for ws in completed_sessions:
        if ws.completed_at and ws.completed_at >= week_start:
            this_week += 1
        if ws.completed_at and ws.completed_at >= month_start:
            this_month += 1
        for se in ws.exercises:
            for s in se.sets:
                if s.reps > 0:
                    total_sets += 1
                    total_volume += s.reps * s.weight

    return {
        "total_sessions": total,
        "this_week": this_week,
        "this_month": this_month,
        "total_sets": total_sets,
        "total_volume": round(total_volume, 1),
    }


def get_weekly_counts(user_id: str, session: Session, weeks: int = 12) -> list[dict]:
    """Workouts per week for the last N weeks — single query, bucketed in Python."""
    now = datetime.utcnow()
    cutoff = now - timedelta(weeks=weeks)
    cutoff = cutoff - timedelta(days=cutoff.weekday())
    cutoff = cutoff.replace(hour=0, minute=0, second=0, microsecond=0)

    all_ws = session.exec(
        select(WorkoutSession).where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.completed_at.is_not(None),  # type: ignore[union-attr]
            WorkoutSession.completed_at >= cutoff,  # type: ignore[arg-type]
        )
    ).all()

    # Build week buckets
    buckets: dict[str, int] = {}
    for i in range(weeks - 1, -1, -1):
        start = now - timedelta(weeks=i)
        start = start - timedelta(days=start.weekday())
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
        buckets[start.strftime("%b %d")] = 0

    # Fill counts
    for ws in all_ws:
        if not ws.completed_at:
            continue
        ws_week_start = ws.completed_at - timedelta(days=ws.completed_at.weekday())
        ws_week_start = ws_week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        key = ws_week_start.strftime("%b %d")
        if key in buckets:
            buckets[key] += 1

    return [{"week": week, "count": count} for week, count in buckets.items()]


def get_exercise_trend(
    user_id: str, exercise_id: str, session: Session
) -> list[dict]:
    """Weight/reps trend for a specific exercise. Aggregates per session if exercise appears multiple times."""
    sessions = session.exec(
        select(WorkoutSession)
        .where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.completed_at.is_not(None),  # type: ignore[union-attr]
        )
        .order_by(WorkoutSession.completed_at.asc())  # type: ignore[union-attr]
    ).all()

    trend = []
    for ws in sessions:
        # Collect all sets for this exercise across all session_exercises in this session
        all_sets = [
            s
            for se in ws.exercises
            if se.exercise_id == exercise_id
            for s in se.sets
            if s.reps > 0
        ]
        if not all_sets:
            continue
        best_set = max(all_sets, key=lambda s: s.weight)
        total_volume = sum(s.reps * s.weight for s in all_sets)
        trend.append({
            "date": ws.completed_at.isoformat() if ws.completed_at else "",
            "max_weight": best_set.weight,
            "best_reps": best_set.reps,
            "total_volume": round(total_volume, 1),
            "sets": len(all_sets),
        })

    return trend


def get_personal_bests(user_id: str, session: Session) -> list[dict]:
    """Heaviest weight lifted per exercise — batch exercise lookup."""
    completed_sessions = _get_completed_sessions(user_id, session)

    # exercise_id -> {weight, reps, date}
    bests: dict[str, dict] = {}
    for ws in completed_sessions:
        for se in ws.exercises:
            for s in se.sets:
                if s.reps <= 0 or s.weight <= 0:
                    continue
                current = bests.get(se.exercise_id)
                if not current or s.weight > current["weight"]:
                    bests[se.exercise_id] = {
                        "exercise_id": se.exercise_id,
                        "weight": s.weight,
                        "reps": s.reps,
                        "date": ws.completed_at.isoformat() if ws.completed_at else "",
                    }

    if not bests:
        return []

    # Batch fetch exercise names
    exercise_ids = list(bests.keys())
    exercise_rows = session.exec(
        select(Exercise).where(col(Exercise.id).in_(exercise_ids))
    ).all()
    exercise_map = {e.id: e for e in exercise_rows}

    result = []
    for exercise_id, best in bests.items():
        exercise = exercise_map.get(exercise_id)
        result.append({
            **best,
            "exercise_name": exercise.name if exercise else "Unknown",
            "muscle_group": exercise.muscle_group if exercise else "",
        })

    result.sort(key=lambda x: x["exercise_name"])
    return result
