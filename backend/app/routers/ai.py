from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from app.database import get_session
from app.auth.supabase import ensure_user_exists
from app.models.user import User
from app.services.ai_service import ChatMessage, WorkoutAction, chat, execute_action

router = APIRouter(prefix="/api/ai", tags=["ai"])


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class ConfirmRequest(BaseModel):
    action: str
    session_id: str | None = None


class SettingsUpdate(BaseModel):
    ai_enabled: bool


@router.post("/chat")
async def ai_chat(
    data: ChatRequest,
    user_id: str = Depends(ensure_user_exists),
    session: Session = Depends(get_session),
):
    """Process a chat message through the AI assistant."""
    # Check if AI is enabled for this user
    user = session.get(User, user_id)
    if user and not user.ai_enabled:
        raise HTTPException(status_code=403, detail="AI features are disabled")

    return await chat(data.messages, user_id, session)


@router.post("/confirm")
def ai_confirm(
    data: ConfirmRequest,
    user_id: str = Depends(ensure_user_exists),
    session: Session = Depends(get_session),
):
    """Execute a previously confirmed AI action."""
    if data.action == "delete_session":
        action = WorkoutAction(
            action="delete_session",
            requires_confirmation=False,
            summary="Deleting session as confirmed",
            session_id=data.session_id,
        )
        return execute_action(action, user_id, session)
    raise HTTPException(status_code=400, detail="Unknown action to confirm")


@router.get("/settings")
def get_ai_settings(
    user_id: str = Depends(ensure_user_exists),
    session: Session = Depends(get_session),
):
    """Get current AI settings for the user."""
    user = session.get(User, user_id)
    return {"ai_enabled": user.ai_enabled if user else True}


@router.put("/settings")
def update_ai_settings(
    data: SettingsUpdate,
    user_id: str = Depends(ensure_user_exists),
    session: Session = Depends(get_session),
):
    """Toggle AI on/off for the user."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.ai_enabled = data.ai_enabled
    session.add(user)
    session.commit()
    return {"ai_enabled": user.ai_enabled}
