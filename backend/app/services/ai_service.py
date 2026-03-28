import json
import os
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel
from sqlmodel import Session, select

from app.config import get_settings
from app.models.exercise import Exercise
from app.models.routine import Routine, RoutineExercise
from app.models.session import WorkoutSession, SessionExercise, ExerciseSet


# --- Pydantic schemas for structured AI output ---


class SessionExerciseData(BaseModel):
    exercise_name: str
    sets: int = 3
    reps: int = 10
    weight: float = 0.0


class SessionData(BaseModel):
    routine_name: str | None = None
    exercises: list[SessionExerciseData] = []
    notes: str = ""


class WorkoutAction(BaseModel):
    action: Literal["create_session", "edit_session", "delete_session", "info"]
    requires_confirmation: bool = False
    summary: str
    session_data: SessionData | None = None
    session_id: str | None = None


# --- Chat message types ---


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


# --- System prompt ---

_SYSTEM_TEMPLATE = (
    "You are a workout assistant integrated into a workout tracking app. "
    "You help users manage their workouts by creating, editing, and deleting workout sessions.\n\n"
    "You MUST respond with a valid JSON object matching this schema:\n"
    '{{\n'
    '  "action": "create_session" | "edit_session" | "delete_session" | "info",\n'
    '  "requires_confirmation": true/false,\n'
    '  "summary": "human-readable summary of what you\'re doing",\n'
    '  "session_data": {{ "routine_name": "optional", "exercises": [{{"exercise_name": "...", "sets": 3, "reps": 10, "weight": 0}}], "notes": "" }} | null,\n'
    '  "session_id": "uuid" | null\n'
    '}}\n\n'
    "Rules:\n"
    '- For "create_session": provide session_data with exercises. Match exercise names to the available exercises list.\n'
    '- For "edit_session": provide session_id and session_data with the updated exercises.\n'
    '- For "delete_session": provide session_id. ALWAYS set requires_confirmation to true.\n'
    '- For "info": just provide a helpful summary answering the user\'s question. No session_data needed.\n'
    "- When creating workouts, use reasonable defaults (3 sets, 8-12 reps) unless specified.\n"
    "- Be concise in summaries.\n"
    '- If the user\'s request is unclear, use "info" action to ask for clarification.\n\n'
    "Available exercises:\n{exercises}\n\n"
    "User's recent sessions:\n{sessions}\n\n"
    "User's routines:\n{routines}"
)


MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}


def _build_context(user_id: str, db: Session) -> dict[str, str]:
    """Build context strings for exercises, sessions, and routines."""
    # Exercises
    exercises = db.exec(select(Exercise)).all()
    exercise_lines = [f"- {e.name} (id: {e.id}, muscle: {e.muscle_group})" for e in exercises]

    # Recent sessions (last 5 completed)
    sessions = db.exec(
        select(WorkoutSession)
        .where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.completed_at.is_not(None),  # type: ignore[union-attr]
        )
        .order_by(WorkoutSession.completed_at.desc())  # type: ignore[union-attr]
        .limit(5)
    ).all()

    session_lines = []
    for ws in sessions:
        ex_names = []
        for se in ws.exercises:
            ex = db.get(Exercise, se.exercise_id)
            if ex:
                ex_names.append(ex.name)
        date_str = ws.completed_at.strftime("%Y-%m-%d") if ws.completed_at else "in progress"
        session_lines.append(f"- Session id={ws.id} on {date_str}: {', '.join(ex_names) or 'no exercises'}")

    # Routines
    routines = db.exec(
        select(Routine).where(Routine.user_id == user_id)
    ).all()
    routine_lines = []
    for r in routines:
        r_exercises = db.exec(
            select(RoutineExercise).where(RoutineExercise.routine_id == r.id)
        ).all()
        ex_names = []
        for re in r_exercises:
            ex = db.get(Exercise, re.exercise_id)
            if ex:
                ex_names.append(ex.name)
        routine_lines.append(f"- {r.name} (id: {r.id}): {', '.join(ex_names) or 'empty'}")

    return {
        "exercises": "\n".join(exercise_lines) or "No exercises available",
        "sessions": "\n".join(session_lines) or "No recent sessions",
        "routines": "\n".join(routine_lines) or "No routines",
    }


def _resolve_exercise(name: str, db: Session) -> Exercise | None:
    """Find exercise by name (case-insensitive fuzzy match)."""
    # Exact match first
    ex = db.exec(
        select(Exercise).where(Exercise.name == name)
    ).first()
    if ex:
        return ex

    # Case-insensitive match
    all_exercises = db.exec(select(Exercise)).all()
    name_lower = name.lower()
    for e in all_exercises:
        if e.name.lower() == name_lower:
            return e

    # Partial match
    for e in all_exercises:
        if name_lower in e.name.lower() or e.name.lower() in name_lower:
            return e

    return None


def execute_action(action: WorkoutAction, user_id: str, db: Session) -> dict:
    """Execute a parsed AI action against the database."""
    if action.action == "info":
        return {"success": True, "message": action.summary}

    if action.action == "create_session":
        if not action.session_data or not action.session_data.exercises:
            return {"success": False, "message": "No exercises specified for the session"}

        ws = WorkoutSession(user_id=user_id, notes=action.session_data.notes)
        db.add(ws)
        db.flush()

        for i, ex_data in enumerate(action.session_data.exercises):
            exercise = _resolve_exercise(ex_data.exercise_name, db)
            if not exercise:
                continue

            se = SessionExercise(
                session_id=ws.id,
                exercise_id=exercise.id,
                order=i,
            )
            db.add(se)
            db.flush()

            for s in range(1, ex_data.sets + 1):
                es = ExerciseSet(
                    session_exercise_id=se.id,
                    set_number=s,
                    reps=0,
                    weight=ex_data.weight,
                )
                db.add(es)

        db.commit()
        db.refresh(ws)
        return {
            "success": True,
            "message": action.summary,
            "session_id": ws.id,
        }

    if action.action == "delete_session":
        if not action.session_id:
            return {"success": False, "message": "No session ID provided"}

        ws = db.get(WorkoutSession, action.session_id)
        if not ws:
            return {"success": False, "message": "Session not found"}
        if ws.user_id != user_id:
            return {"success": False, "message": "Not your session"}

        for se in ws.exercises:
            for s in se.sets:
                db.delete(s)
            db.delete(se)
        db.delete(ws)
        db.commit()
        return {"success": True, "message": action.summary}

    return {"success": False, "message": f"Unknown action: {action.action}"}


async def chat(
    messages: list[ChatMessage],
    user_id: str,
    db: Session,
) -> dict:
    """Process a chat message through the AI and optionally execute the action."""
    settings = get_settings()

    if not settings.openrouter_api_key:
        return {
            "response": "AI features are not configured. Please set OPENROUTER_API_KEY.",
            "action": None,
        }

    # Set the API key for LiteLLM/OpenRouter
    os.environ["OPENROUTER_API_KEY"] = settings.openrouter_api_key

    context = _build_context(user_id, db)
    system_message = _SYSTEM_TEMPLATE.format(**context)

    llm_messages = [{"role": "system", "content": system_message}]
    for msg in messages:
        llm_messages.append({"role": msg.role, "content": msg.content})

    try:
        from litellm import acompletion

        response = await acompletion(
            model=MODEL,
            messages=llm_messages,
            response_format={"type": "json_object"},
            extra_body=EXTRA_BODY,
        )

        content = response.choices[0].message.content
        if not content:
            return {
                "response": "The AI didn't return a response. Please try again.",
                "action": None,
            }
        parsed = json.loads(content)
        action = WorkoutAction(**parsed)

        # Auto-execute non-destructive actions, require confirmation for destructive ones
        result = None
        if not action.requires_confirmation:
            result = execute_action(action, user_id, db)

        return {
            "response": action.summary,
            "action": {
                "type": action.action,
                "requires_confirmation": action.requires_confirmation,
                "session_id": action.session_id or (result and result.get("session_id")),
                "session_data": action.session_data.model_dump() if action.session_data else None,
            },
            "result": result,
        }

    except Exception as e:
        return {
            "response": f"Sorry, I couldn't process that request. Error: {str(e)}",
            "action": None,
        }
