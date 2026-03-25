import uuid
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON


class Exercise(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str = Field(index=True)
    description: str = ""
    muscle_group: str = Field(index=True)
    tags: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    is_custom: bool = Field(default=False)
    user_id: str | None = Field(default=None, index=True)
