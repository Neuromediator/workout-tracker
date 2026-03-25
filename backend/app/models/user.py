from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    id: str = Field(primary_key=True)  # Supabase UUID
    ai_enabled: bool = Field(default=True)
