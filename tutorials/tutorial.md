# Workout Tracker -- Tutorial

---

# Phase 1: Foundation -- Scaffolding проекта

## Содержание

1. [Обзор технологий](#1-обзор-технологий)
2. [Общая архитектура проекта](#2-общая-архитектура-проекта)
3. [Структура файлов Phase 1](#3-структура-файлов-phase-1)
4. [Backend: подробный разбор](#4-backend-подробный-разбор)
   - [4.1 pyproject.toml -- зависимости](#41-pyprojecttoml--зависимости)
   - [4.2 config.py -- конфигурация](#42-configpy--конфигурация)
   - [4.3 database.py -- подключение к БД](#43-databasepy--подключение-к-бд)
   - [4.4 Модели данных (SQLModel)](#44-модели-данных-sqlmodel)
   - [4.5 auth/supabase.py -- аутентификация](#45-authsupabasepy--аутентификация)
   - [4.6 seed/loader.py -- начальные данные](#46-seedloaderpy--начальные-данные)
   - [4.7 main.py -- точка входа](#47-mainpy--точка-входа)
5. [Frontend: подробный разбор](#5-frontend-подробный-разбор)
   - [5.1 Vite + React + TypeScript](#51-vite--react--typescript)
   - [5.2 Tailwind CSS v4 + shadcn/ui](#52-tailwind-css-v4--shadcnui)
   - [5.3 Supabase клиент](#53-supabase-клиент)
   - [5.4 useAuth -- хук аутентификации](#54-useauth--хук-аутентификации)
   - [5.5 API клиент](#55-api-клиент)
   - [5.6 Страницы (Login, Dashboard)](#56-страницы-login-dashboard)
   - [5.7 App.tsx -- маршрутизация](#57-apptsx--маршрутизация)
6. [Docker Compose для разработки](#6-docker-compose-для-разработки)
7. [Как всё работает вместе](#7-как-всё-работает-вместе)
8. [Запуск проекта](#8-запуск-проекта)

---

## 1. Обзор технологий

В Phase 1 мы создаём скелет приложения -- базовую структуру, на которой будут строиться все остальные фазы. Вот технологии, которые мы используем, и зачем каждая из них нужна:

| Технология | Роль в проекте | Почему именно она |
|---|---|---|
| **Python** | Язык бэкенда | Простой синтаксис, огромная экосистема, хорошо подходит для API |
| **FastAPI** | Веб-фреймворк (API) | Быстрый, автоматическая документация, встроенная валидация через Pydantic |
| **SQLModel** | ORM (работа с базой данных) | Объединяет SQLAlchemy (работа с БД) и Pydantic (валидация данных) в одном классе |
| **SQLite** | База данных | Файловая БД, не требует установки сервера, идеально для персонального проекта |
| **Pydantic Settings** | Конфигурация | Загружает переменные окружения из `.env` файла с валидацией типов |
| **python-jose** | JWT токены | Расшифровка и проверка JWT токенов от Supabase |
| **uv** | Менеджер пакетов Python | Быстрая альтернатива pip, управляет зависимостями и виртуальным окружением |
| **React** | UI-библиотека (фронтенд) | Компонентный подход, огромное сообщество |
| **TypeScript** | Язык фронтенда | JavaScript с типами -- ловит ошибки до запуска кода |
| **Vite** | Сборщик фронтенда | Мгновенный запуск dev-сервера, быстрая пересборка при изменении файлов |
| **Tailwind CSS v4** | CSS-фреймворк | Стилизация прямо в HTML-классах, без написания отдельных CSS-файлов |
| **shadcn/ui** | UI-компоненты | Красивые готовые компоненты (кнопки, формы и т.д.), которые копируются в проект |
| **Supabase Auth** | Аутентификация | Готовый сервис регистрации/входа, не нужно писать свою систему паролей |
| **Docker Compose** | Контейнеризация | Запуск бэкенда и фронтенда одной командой в изолированных контейнерах |

---

## 2. Общая архитектура проекта

Приложение состоит из двух частей, которые общаются между собой через HTTP API:

```
┌─────────────────────┐         ┌─────────────────────┐
│     FRONTEND        │         │      BACKEND         │
│  (React + Vite)     │  HTTP   │    (FastAPI)         │
│                     │────────>│                      │
│  localhost:5173     │  /api/* │  localhost:8000      │
│                     │<────────│                      │
└─────────┬───────────┘         └──────────┬──────────┘
          │                                │
          │ HTTPS                          │ File I/O
          ▼                                ▼
┌─────────────────────┐         ┌─────────────────────┐
│   Supabase Auth     │         │    SQLite Database   │
│  (облачный сервис)  │         │  (workout_tracker.db)│
└─────────────────────┘         └─────────────────────┘
```

**Поток аутентификации:**
1. Пользователь вводит email/пароль на фронтенде
2. Фронтенд отправляет данные напрямую в Supabase Auth
3. Supabase возвращает JWT-токен (зашифрованная строка с данными пользователя)
4. Фронтенд прикрепляет этот токен к каждому запросу к бэкенду
5. Бэкенд проверяет токен и извлекает из него ID пользователя

---

## 3. Структура файлов Phase 1

```
workout-tracker/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # Точка входа FastAPI
│   │   ├── config.py            # Загрузка переменных окружения
│   │   ├── database.py          # Подключение к SQLite
│   │   ├── models/              # Модели данных
│   │   │   ├── __init__.py      # Импорт всех моделей
│   │   │   ├── user.py          # Модель пользователя
│   │   │   ├── exercise.py      # Модель упражнения
│   │   │   ├── routine.py       # Модель программы тренировок
│   │   │   └── session.py       # Модель тренировочной сессии
│   │   ├── auth/
│   │   │   └── supabase.py      # Проверка JWT-токенов
│   │   ├── routers/             # (пока пусто, API-роуты будут в Phase 2)
│   │   ├── services/            # (пока пусто, бизнес-логика будет позже)
│   │   └── seed/
│   │       ├── exercises.json   # 31 упражнение для библиотеки
│   │       └── loader.py        # Загрузчик начальных данных
│   ├── pyproject.toml           # Зависимости Python
│   ├── uv.lock                  # Зафиксированные версии пакетов
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── main.tsx             # Точка входа React
│   │   ├── App.tsx              # Главный компонент
│   │   ├── index.css            # Tailwind + shadcn стили
│   │   ├── api/
│   │   │   └── client.ts        # HTTP-клиент с авторизацией
│   │   ├── components/ui/       # shadcn/ui компоненты
│   │   ├── hooks/
│   │   │   └── useAuth.ts       # Хук для работы с авторизацией
│   │   ├── lib/
│   │   │   ├── supabase.ts      # Supabase клиент
│   │   │   └── utils.ts         # Утилиты (от shadcn)
│   │   └── pages/
│   │       ├── Login.tsx         # Страница входа/регистрации
│   │       └── Dashboard.tsx     # Главная страница (заглушка)
│   ├── .env                     # Переменные для фронтенда (VITE_*)
│   ├── vite.config.ts           # Конфигурация Vite
│   ├── tsconfig.json            # Конфигурация TypeScript
│   ├── package.json             # Зависимости Node.js
│   └── Dockerfile
├── .env                         # Переменные окружения (секреты)
├── .gitignore                   # Файлы, исключённые из Git
└── docker-compose.dev.yml       # Запуск в Docker для разработки
```

---

## 4. Backend: подробный разбор

### 4.1 pyproject.toml -- зависимости

Файл `pyproject.toml` -- это "паспорт" Python-проекта. Он описывает название, версию и все библиотеки, от которых зависит проект.

```toml
[project]
name = "backend"
version = "0.1.0"
description = "Workout Tracker API"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115",
    "uvicorn[standard]>=0.34",
    "sqlmodel>=0.0.24",
    "pydantic-settings>=2.7",
    "python-jose[cryptography]>=3.3",
    "httpx>=0.28",
]

[dependency-groups]
dev = [
    "pytest>=8.0",
    "pytest-asyncio>=0.25",
    "httpx>=0.28",
]
```

**Что здесь происходит:**

- `requires-python = ">=3.12"` -- проект требует Python 3.12 или новее
- `dependencies` -- библиотеки, нужные для работы приложения:
  - `fastapi` -- веб-фреймворк
  - `uvicorn[standard]` -- ASGI-сервер, который запускает FastAPI. `[standard]` добавляет поддержку авто-перезагрузки
  - `sqlmodel` -- ORM для работы с базой данных
  - `pydantic-settings` -- загрузка конфигурации из `.env`
  - `python-jose[cryptography]` -- проверка JWT-токенов. `[cryptography]` добавляет быстрый бэкенд шифрования
  - `httpx` -- HTTP-клиент (будет нужен для тестов и внешних запросов)
- `[dependency-groups] dev` -- библиотеки только для разработки (тесты), не попадают в production

**Что такое `uv.lock`?**

Файл `uv.lock` автоматически генерируется командой `uv sync`. Он фиксирует точные версии всех установленных пакетов (включая зависимости зависимостей). Это гарантирует, что у всех разработчиков будут одинаковые версии библиотек. Этот файл не редактируется вручную.

---

### 4.2 config.py -- конфигурация

```python
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_jwt_secret: str = ""
    openrouter_api_key: str = ""
    database_url: str = "sqlite:///./workout_tracker.db"

    model_config = {"env_file": "../.env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

**Построчный разбор:**

- `class Settings(BaseSettings)` -- создаём класс настроек, наследуя от `BaseSettings`. Это специальный класс из `pydantic-settings`, который умеет автоматически загружать значения из переменных окружения (environment variables)
- Каждое поле класса соответствует переменной окружения:
  - `supabase_url: str = ""` -- Pydantic ищет переменную `SUPABASE_URL` в `.env` файле. Если не найдёт, используется значение по умолчанию `""`
  - `database_url` -- путь к файлу SQLite. `sqlite:///./workout_tracker.db` означает "файл `workout_tracker.db` в текущей директории"
- `model_config = {"env_file": "../.env", "extra": "ignore"}`:
  - `env_file: "../.env"` -- указывает путь к `.env` файлу (на уровень выше, т.к. бэкенд запускается из `backend/`)
  - `extra: "ignore"` -- игнорировать переменные из `.env`, которые не описаны в классе (например, если в `.env` есть лишние переменные)
- `@lru_cache` -- декоратор кэширования. Функция `get_settings()` вызывается много раз по всему коду, но `.env` файл читается только один раз. Все последующие вызовы возвращают тот же объект из кэша
- `def get_settings() -> Settings` -- функция-фабрика. Используется через систему Dependency Injection в FastAPI (об этом ниже)

**Что такое `.env` файл?**

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_JWT_SECRET=super-secret-jwt...
OPENROUTER_API_KEY=sk-or-...
```

Это простой текстовый файл с переменными вида `КЛЮЧ=ЗНАЧЕНИЕ`. Он хранит секреты (API-ключи, пароли) и **никогда не коммитится в Git** (указан в `.gitignore`).

---

### 4.3 database.py -- подключение к БД

```python
from sqlmodel import SQLModel, Session, create_engine
from app.config import get_settings

engine = create_engine(
    get_settings().database_url,
    echo=False,
    connect_args={"check_same_thread": False},
)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
```

**Построчный разбор:**

- `engine = create_engine(...)` -- создаёт "движок" базы данных. Это объект, который управляет подключением к SQLite:
  - `get_settings().database_url` -- берёт путь к БД из настроек
  - `echo=False` -- не выводить SQL-запросы в консоль (поставьте `True` для отладки)
  - `check_same_thread=False` -- специфика SQLite: по умолчанию SQLite запрещает использование одного подключения из разных потоков. FastAPI работает асинхронно и может вызывать код из разных потоков, поэтому эту проверку отключаем

- `create_db_and_tables()` -- создаёт все таблицы в базе данных на основе описанных моделей. Вызывается при старте сервера. Если таблицы уже существуют, ничего не делает

- `get_session()` -- **генератор**, который создаёт сессию для работы с БД:
  - `with Session(engine) as session` -- открывает сессию (аналог "транзакции")
  - `yield session` -- отдаёт сессию вызывающему коду
  - Когда код закончит работу с сессией, блок `with` автоматически закроет её
  - Это стандартный паттерн **Dependency Injection** в FastAPI -- мы сможем "внедрять" сессию в любой API-эндпоинт

---

### 4.4 Модели данных (SQLModel)

Модели -- это Python-классы, которые описывают структуру таблиц в базе данных. SQLModel позволяет использовать один класс и как описание таблицы (ORM), и как схему валидации данных (Pydantic).

#### User -- пользователь

```python
from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    id: str = Field(primary_key=True)  # Supabase UUID
    ai_enabled: bool = Field(default=True)
```

- `table=True` -- указывает SQLModel, что этот класс соответствует таблице в БД. Без этого флага класс будет просто Pydantic-моделью для валидации
- `id: str = Field(primary_key=True)` -- первичный ключ. Мы используем `str`, потому что Supabase генерирует UUID (строку вроде `"a1b2c3d4-e5f6-..."`). Значение приходит из JWT-токена, а не генерируется нами
- `ai_enabled: bool = Field(default=True)` -- настройка пользователя: включен ли AI-помощник. По умолчанию `True`

#### Exercise -- упражнение

```python
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
```

- `default_factory=lambda: str(uuid.uuid4())` -- при создании нового упражнения автоматически генерируется уникальный ID. `uuid4()` создаёт случайный UUID
- `Field(index=True)` -- создаёт индекс в БД для быстрого поиска по этому полю. Мы индексируем `name` и `muscle_group`, потому что будем часто искать по ним
- `tags: list[str]` -- список тегов (например, `["barbell", "compound"]`). SQLite не поддерживает массивы, поэтому:
  - `sa_column=Column(JSON)` -- указывает SQLAlchemy хранить это поле как JSON-строку в БД. При чтении автоматически конвертируется обратно в список
- `is_custom: bool` -- отличает стандартные упражнения из библиотеки (`False`) от пользовательских (`True`)
- `user_id: str | None` -- если упражнение пользовательское, здесь хранится ID создателя. `None` для стандартных упражнений. Синтаксис `str | None` (Python 3.10+) означает "строка или ничего"

#### Routine + RoutineExercise -- программа тренировок

```python
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
```

**Новые концепции:**

- `__tablename__ = "routine_exercise"` -- явное указание имени таблицы. По умолчанию SQLModel берёт имя класса (`routineexercise`), но `routine_exercise` читабельнее
- `foreign_key="routine.id"` -- **внешний ключ**. Связывает запись `RoutineExercise` с конкретной `Routine`. БД гарантирует, что `routine_id` всегда ссылается на существующую программу
- `Relationship(back_populates="routine_exercises")` -- **связь** между моделями. Позволяет из объекта `Routine` получить список всех его упражнений через `routine.routine_exercises`, а из `RoutineExercise` получить родительскую программу через `re.routine`
- `"Routine"` в кавычках -- **forward reference** (ссылка вперёд). Класс `Routine` описан ниже, поэтому на момент определения `RoutineExercise` его ещё не существует. Кавычки говорят Python: "этот класс появится позже"

**Зачем промежуточная таблица `RoutineExercise`?**

Одна программа содержит много упражнений, и одно упражнение может быть в разных программах. Это **связь многие-ко-многим**. Промежуточная таблица хранит эту связь + дополнительные данные: порядок упражнения, целевое количество подходов и повторений.

#### WorkoutSession + SessionExercise + ExerciseSet -- тренировочная сессия

```python
import uuid
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship


class ExerciseSet(SQLModel, table=True):
    __tablename__ = "exercise_set"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    session_exercise_id: str = Field(foreign_key="session_exercise.id", index=True)
    set_number: int
    reps: int = 0
    weight: float = 0.0
    notes: str = ""

    session_exercise: "SessionExercise" = Relationship(back_populates="sets")


class SessionExercise(SQLModel, table=True):
    __tablename__ = "session_exercise"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    session_id: str = Field(foreign_key="workout_session.id", index=True)
    exercise_id: str = Field(foreign_key="exercise.id")
    order: int = 0

    session: "WorkoutSession" = Relationship(back_populates="exercises")
    sets: list[ExerciseSet] = Relationship(back_populates="session_exercise")


class WorkoutSession(SQLModel, table=True):
    __tablename__ = "workout_session"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(index=True)
    routine_id: str | None = Field(default=None, foreign_key="routine.id")
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: datetime | None = None
    notes: str = ""

    exercises: list[SessionExercise] = Relationship(back_populates="session")
```

**Иерархия данных тренировки:**

```
WorkoutSession (тренировка)
  └── SessionExercise (упражнение в тренировке)
        └── ExerciseSet (один подход)
              ├── set_number: 1
              ├── reps: 10
              └── weight: 80.0
```

Пример: пользователь начал тренировку (`WorkoutSession`), выполнял жим лёжа (`SessionExercise` со ссылкой на `Exercise`), и сделал 3 подхода (`ExerciseSet`) по 10 повторений с весом 80 кг.

- `started_at: datetime = Field(default_factory=datetime.utcnow)` -- время начала тренировки. `default_factory=datetime.utcnow` автоматически ставит текущее время при создании записи
- `completed_at: datetime | None = None` -- время завершения. `None` означает, что тренировка ещё идёт

#### models/__init__.py -- импорт всех моделей

```python
from app.models.user import User
from app.models.exercise import Exercise
from app.models.routine import Routine, RoutineExercise
from app.models.session import WorkoutSession, SessionExercise, ExerciseSet
```

Этот файл нужен для двух целей:
1. **Удобство импорта** -- вместо `from app.models.exercise import Exercise` можно писать `from app.models import Exercise`
2. **Регистрация моделей в SQLModel** -- когда мы вызываем `SQLModel.metadata.create_all(engine)`, SQLModel должен "знать" обо всех моделях. Импорт в `__init__.py` гарантирует, что все классы загружены в память

---

### 4.5 auth/supabase.py -- аутентификация

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlmodel import Session
from app.config import get_settings
from app.database import get_session
from app.models.user import User

security = HTTPBearer()


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    settings = get_settings()
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing sub",
            )
        return user_id
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


def ensure_user_exists(
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> str:
    user = session.get(User, user_id)
    if not user:
        user = User(id=user_id)
        session.add(user)
        session.commit()
    return user_id
```

**Это самый сложный файл Phase 1. Разберём по частям:**

**`security = HTTPBearer()`** -- создаёт объект, который извлекает токен из заголовка `Authorization: Bearer <token>`. FastAPI автоматически вернёт 403, если заголовок отсутствует.

**`get_current_user_id()`** -- основная функция аутентификации:
- `Depends(security)` -- **Dependency Injection**. FastAPI автоматически вызывает `security` и передаёт результат (извлечённый токен) в параметр `credentials`
- `jwt.decode(...)` -- расшифровывает JWT-токен:
  - `credentials.credentials` -- сам токен (строка)
  - `settings.supabase_jwt_secret` -- секретный ключ для проверки подписи
  - `algorithms=["HS256"]` -- алгоритм шифрования (Supabase использует HS256)
  - `audience="authenticated"` -- проверяет, что токен предназначен для аутентифицированных пользователей
- `payload.get("sub")` -- извлекает ID пользователя из токена. `sub` (subject) -- стандартное поле JWT, содержащее идентификатор
- Если токен невалидный или просроченный, `jwt.decode` бросает `JWTError`, и мы возвращаем HTTP 401

**`ensure_user_exists()`** -- гарантирует, что пользователь есть в нашей БД:
- `Depends(get_current_user_id)` -- сначала проверяет токен (цепочка зависимостей!)
- `Depends(get_session)` -- получает сессию БД
- Если пользователя нет в нашей SQLite -- создаёт запись. Это происходит при первом запросе нового пользователя

**Что такое Dependency Injection в FastAPI?**

Это паттерн, при котором FastAPI сам создаёт и передаёт нужные объекты в функции. Цепочка зависимостей:

```
HTTP-запрос с токеном
    ↓
HTTPBearer извлекает токен из заголовка
    ↓
get_current_user_id() проверяет токен, возвращает user_id
    ↓
ensure_user_exists() проверяет/создаёт пользователя в БД
    ↓
API-эндпоинт получает готовый user_id
```

---

### 4.6 seed/loader.py -- начальные данные

```python
import json
from pathlib import Path
from sqlmodel import Session, select
from app.database import engine
from app.models.exercise import Exercise


def seed_exercises():
    with Session(engine) as session:
        existing = session.exec(
            select(Exercise).where(Exercise.is_custom == False)
        ).first()
        if existing:
            return

        seed_path = Path(__file__).parent / "exercises.json"
        exercises = json.loads(seed_path.read_text())
        for data in exercises:
            session.add(Exercise(**data))
        session.commit()
```

**Что делает этот код:**

1. Открывает сессию БД
2. Проверяет, есть ли уже стандартные упражнения (`is_custom == False`)
3. Если есть -- ничего не делает (чтобы не дублировать при каждом запуске)
4. Если нет -- читает `exercises.json` и создаёт записи в БД

**Детали:**
- `Path(__file__).parent / "exercises.json"` -- путь к JSON-файлу рядом с текущим скриптом. `__file__` -- встроенная переменная Python, содержащая путь к текущему файлу
- `Exercise(**data)` -- **распаковка словаря**. Если `data = {"name": "Bench Press", "muscle_group": "chest"}`, то `Exercise(**data)` эквивалентно `Exercise(name="Bench Press", muscle_group="chest")`
- `session.add()` -- добавляет объект в сессию (ещё не записывает в БД)
- `session.commit()` -- записывает все изменения в БД одной транзакцией

Файл `exercises.json` содержит 31 упражнение по 6 группам мышц: грудь, ноги, спина, плечи, руки, кор.

---

### 4.7 main.py -- точка входа

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import create_db_and_tables
from app.seed.loader import seed_exercises


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    seed_exercises()
    yield


app = FastAPI(title="Workout Tracker API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}
```

**Построчный разбор:**

**`lifespan`** -- функция жизненного цикла приложения:
- Код **до** `yield` выполняется при **старте** сервера:
  - `create_db_and_tables()` -- создаёт таблицы в SQLite
  - `seed_exercises()` -- загружает начальные упражнения
- Код **после** `yield` выполняется при **остановке** сервера (у нас его нет, но можно добавить закрытие соединений и т.д.)
- `@asynccontextmanager` -- делает из генератора асинхронный контекстный менеджер (требование FastAPI)

**`app = FastAPI(...)`** -- создаёт приложение FastAPI:
- `title="Workout Tracker API"` -- название, отображается в автоматической документации на `/docs`
- `lifespan=lifespan` -- привязывает функцию жизненного цикла

**CORS Middleware** -- решает проблему кросс-доменных запросов:
- Фронтенд на `localhost:5173`, бэкенд на `localhost:8000` -- это разные "домены"
- Без CORS браузер заблокирует запросы фронтенда к бэкенду
- `allow_origins=["http://localhost:5173"]` -- разрешаем запросы только с нашего фронтенда
- `allow_credentials=True` -- разрешаем отправку cookies и авторизационных заголовков
- `allow_methods=["*"]` / `allow_headers=["*"]` -- разрешаем все HTTP-методы и заголовки

**`@app.get("/api/health")`** -- простейший эндпоинт для проверки работоспособности сервера. Возвращает `{"status": "ok"}`.

---

## 5. Frontend: подробный разбор

### 5.1 Vite + React + TypeScript

**main.tsx** -- точка входа приложения:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- `createRoot(document.getElementById('root')!)` -- находит DOM-элемент `<div id="root">` в `index.html` и создаёт в нём React-приложение. `!` -- оператор TypeScript "я точно знаю, что это не null"
- `<StrictMode>` -- обёртка React для отладки. В dev-режиме помогает находить потенциальные проблемы (например, двойной вызов `useEffect`)
- `import './index.css'` -- подключает стили Tailwind

### 5.2 Tailwind CSS v4 + shadcn/ui

**vite.config.ts** -- конфигурация сборщика:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
```

- `plugins: [react(), tailwindcss()]` -- подключает плагины React (JSX-трансформация) и Tailwind CSS v4
- `alias: { '@': ... }` -- позволяет писать `import { Button } from '@/components/ui/button'` вместо `import { Button } from '../../components/ui/button'`. Символ `@` заменяется на путь к `src/`
- `proxy: { '/api': 'http://localhost:8000' }` -- **прокси для разработки**. Когда фронтенд делает запрос на `/api/health`, Vite перенаправляет его на `http://localhost:8000/api/health`. Это решает проблему CORS и имитирует production-окружение, где оба сервиса на одном домене

**shadcn/ui** -- это не npm-пакет, а коллекция компонентов, которые копируются прямо в ваш проект (в `src/components/ui/`). Это означает, что вы можете свободно модифицировать любой компонент. В Phase 1 мы используем только `<Button>`.

---

### 5.3 Supabase клиент

```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- `import.meta.env.VITE_*` -- способ Vite читать переменные окружения. Только переменные с префиксом `VITE_` доступны в браузере (чтобы случайно не раскрыть серверные секреты)
- `createClient(url, key)` -- создаёт клиент Supabase. Использует **публичный** (anon) ключ -- это безопасно, он предназначен для использования в браузере
- Клиент экспортируется как синглтон -- один экземпляр на всё приложение

**Почему два `.env` файла?**

- `.env` (корень проекта) -- секреты для бэкенда (`SUPABASE_JWT_SECRET`). Никогда не попадает в браузер
- `frontend/.env` -- публичные ключи для фронтенда (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Они безопасны для браузера -- это "анонимный" ключ, который лишь идентифицирует ваш Supabase-проект

---

### 5.4 useAuth -- хук аутентификации

```ts
import { useState, useEffect } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { user, session, loading, signOut }
}
```

**Что такое хук (hook)?**

В React хук -- это функция, начинающаяся с `use`, которая позволяет компонентам использовать состояние и побочные эффекты. Пользовательские хуки (как `useAuth`) инкапсулируют переиспользуемую логику.

**Разбор кода:**

- `useState<User | null>(null)` -- создаёт переменную состояния. `User | null` означает "объект пользователя или ничего". Начальное значение `null` (не авторизован)
- `useState(true)` для `loading` -- при загрузке страницы мы ещё не знаем, авторизован ли пользователь, поэтому показываем "Loading..."

**`useEffect(() => { ... }, [])`** -- выполняет код один раз при монтировании компонента:
1. `getSession()` -- проверяет, есть ли активная сессия (например, пользователь уже входил ранее, и токен сохранён в localStorage)
2. `onAuthStateChange()` -- подписывается на изменения состояния авторизации:
   - Пользователь вошёл → обновляем `user` и `session`
   - Пользователь вышел → устанавливаем `null`
   - `_event` -- тип события (мы его не используем, поэтому `_` перед именем)
3. `return () => subscription.unsubscribe()` -- **функция очистки**. Вызывается при размонтировании компонента. Отменяет подписку, чтобы не было утечек памяти

- `session?.user ?? null` -- **optional chaining** + **nullish coalescing**. Если `session` не null, берём `session.user`. Иначе возвращаем `null`

---

### 5.5 API клиент

```ts
import { supabase } from '@/lib/supabase'

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return {}
  return { Authorization: `Bearer ${session.access_token}` }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(await getAuthHeaders()),
    ...options.headers,
  }

  const response = await fetch(`/api${path}`, { ...options, headers })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  return response.json()
}
```

Это обёртка над стандартным `fetch`, которая автоматически:
1. Получает JWT-токен из Supabase
2. Добавляет заголовок `Authorization: Bearer <token>`
3. Добавляет `Content-Type: application/json`
4. Добавляет префикс `/api` к URL
5. Обрабатывает ошибки

**`apiFetch<T>`** -- **дженерик** (generic). `T` -- тип данных, которые вернёт API. Пример использования:

```ts
// TypeScript знает, что exercises -- это массив Exercise
const exercises = await apiFetch<Exercise[]>('/exercises')
```

**`{ ...options, headers }`** -- **spread-оператор**. Создаёт новый объект, копируя все свойства из `options` и перезаписывая `headers` нашими заголовками.

---

### 5.6 Страницы (Login, Dashboard)

#### Login.tsx -- страница входа/регистрации

```tsx
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* ...JSX разметка... */}
      </div>
    </div>
  )
}
```

**Ключевые моменты:**

- Одна форма для входа **и** регистрации. Состояние `isSignUp` переключает режим
- `e.preventDefault()` -- отменяет стандартное поведение формы (перезагрузку страницы)
- `supabase.auth.signUp()` / `signInWithPassword()` -- вызовы Supabase Auth API. Общение идёт напрямую с Supabase (не через наш бэкенд)
- При успешном входе `onAuthStateChange` в `useAuth` автоматически обновляет состояние, и `App.tsx` перерисовывает интерфейс

**Tailwind CSS классы:**
- `flex min-h-screen items-center justify-center` -- flexbox-контейнер на всю высоту экрана с центрированием
- `w-full max-w-sm` -- ширина 100%, но не более 384px
- `space-y-6` -- вертикальные отступы 1.5rem между дочерними элементами
- `text-muted-foreground` -- цвет текста из темы shadcn/ui (серый)

#### Dashboard.tsx -- главная страница

```tsx
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen p-4">
      <header className="flex items-center justify-between border-b pb-4">
        <h1 className="text-2xl font-bold">Workout Tracker</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="outline" size="sm" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="py-8">
        <h2 className="mb-4 text-xl font-semibold">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome! Start a workout or browse your exercise library.
        </p>
      </main>
    </div>
  )
}
```

Пока это заглушка -- в Phase 2 здесь появится полноценный интерфейс с библиотекой упражнений и конструктором программ.

- `useAuth()` -- наш хук. Возвращает текущего пользователя и функцию выхода
- `user?.email` -- отображает email авторизованного пользователя
- `<Button variant="outline" size="sm">` -- компонент кнопки из shadcn/ui с вариантом "обводка" и маленьким размером

---

### 5.7 App.tsx -- маршрутизация

```tsx
import { useAuth } from '@/hooks/useAuth'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return user ? <Dashboard /> : <Login />
}
```

Простая условная маршрутизация:
1. Пока проверяется сессия (`loading === true`) -- показываем "Loading..."
2. Если пользователь авторизован (`user` не null) -- показываем Dashboard
3. Если не авторизован -- показываем Login

В Phase 2 мы заменим это на полноценный роутер (`react-router-dom`) с несколькими страницами.

---

## 6. Docker Compose для разработки

```yaml
services:
  backend:
    build: ./backend
    command: uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    ports:
      - "8000:8000"
    volumes:
      - ./backend/app:/app/app
      - backend-data:/app/data
    env_file:
      - .env
    environment:
      - DATABASE_URL=sqlite:///./data/workout_tracker.db

  frontend:
    build: ./frontend
    command: npm run dev -- --host
    ports:
      - "5173:5173"
    volumes:
      - ./frontend/src:/app/src
    env_file:
      - ./frontend/.env

volumes:
  backend-data:
```

**Что такое Docker Compose?**

Docker Compose позволяет описать несколько сервисов (контейнеров) в одном YAML-файле и запустить их одной командой.

**Разбор конфигурации:**

**Backend сервис:**
- `build: ./backend` -- собирает Docker-образ из `backend/Dockerfile`
- `command: uv run uvicorn ... --reload` -- переопределяет команду запуска. `--reload` автоматически перезапускает сервер при изменении кода
- `--host 0.0.0.0` -- слушать на всех интерфейсах (нужно для Docker, иначе контейнер недоступен извне)
- `ports: "8000:8000"` -- пробрасывает порт: `localhost:8000` на хосте → порт 8000 в контейнере
- `volumes: ./backend/app:/app/app` -- **монтирование директории**. Изменения в файлах на хосте мгновенно отражаются в контейнере (для hot reload)
- `backend-data:/app/data` -- **именованный том** для файла БД. Данные сохраняются между перезапусками контейнера
- `env_file: .env` -- загружает переменные окружения из `.env`

**Frontend сервис:**
- `command: npm run dev -- --host` -- запускает Vite dev-сервер. `--` отделяет аргументы npm от аргументов Vite
- `volumes: ./frontend/src:/app/src` -- монтирует только `src/` (для hot reload при изменении компонентов)

---

## 7. Как всё работает вместе

```
1. Пользователь открывает http://localhost:5173
   ↓
2. Vite отдаёт React-приложение
   ↓
3. React загружается, App.tsx вызывает useAuth()
   ↓
4. useAuth() проверяет сессию в Supabase
   ↓
5a. Нет сессии → показываем Login.tsx
    → Пользователь вводит email/пароль
    → Supabase проверяет и возвращает JWT-токен
    → onAuthStateChange обновляет состояние
    → React перерисовывает → Dashboard.tsx
   ↓
5b. Есть сессия → сразу Dashboard.tsx
   ↓
6. Пользователь взаимодействует с приложением
   ↓
7. Фронтенд вызывает apiFetch('/exercises')
   → apiFetch добавляет JWT-токен в заголовок
   → Vite proxy перенаправляет на localhost:8000
   ↓
8. FastAPI получает запрос
   → auth middleware проверяет JWT-токен
   → извлекает user_id
   → выполняет запрос к SQLite
   → возвращает JSON-ответ
```

---

## 8. Запуск проекта

### Вариант 1: Два терминала (рекомендуется для разработки)

```bash
# Терминал 1 -- бэкенд
cd backend
uv sync            # Установить зависимости (первый раз)
uv run uvicorn app.main:app --reload --port 8000

# Терминал 2 -- фронтенд
cd frontend
npm install        # Установить зависимости (первый раз)
npm run dev
```

Открыть `http://localhost:5173` в браузере.

### Вариант 2: Docker Compose

```bash
docker compose -f docker-compose.dev.yml up
```

### Проверка

- Фронтенд: `http://localhost:5173` -- должна появиться страница входа
- Бэкенд health-check: `http://localhost:8000/api/health` -- должен вернуть `{"status": "ok"}`
- API-документация: `http://localhost:8000/docs` -- интерактивная Swagger-документация FastAPI

---

---

# Phase 2: Core Workout Features -- API, UI и шаблоны тренировок

## Содержание Phase 2

1. [Обзор Phase 2](#p2-1-обзор-phase-2)
2. [Новые файлы и структура](#p2-2-новые-файлы-и-структура)
3. [Backend: API-роутеры](#p2-3-backend-api-роутеры)
   - [3.1 Exercises API -- CRUD упражнений](#p2-31-exercises-api--crud-упражнений)
   - [3.2 Routines API -- CRUD программ тренировок](#p2-32-routines-api--crud-программ-тренировок)
   - [3.3 Seed шаблонов тренировок](#p2-33-seed-шаблонов-тренировок)
   - [3.4 Обновление main.py](#p2-34-обновление-mainpy)
4. [Frontend: API-клиенты](#p2-4-frontend-api-клиенты)
   - [4.1 exercises.ts -- типы и функции](#p2-41-exercisests--типы-и-функции)
   - [4.2 routines.ts -- типы и функции](#p2-42-routinests--типы-и-функции)
   - [4.3 Исправление client.ts для DELETE-запросов](#p2-43-исправление-clientts-для-delete-запросов)
5. [Frontend: страницы](#p2-5-frontend-страницы)
   - [5.1 Exercises.tsx -- библиотека упражнений](#p2-51-exercisestsx--библиотека-упражнений)
   - [5.2 Routines.tsx -- список программ](#p2-52-routinestsx--список-программ)
   - [5.3 RoutineBuilder.tsx -- конструктор программ](#p2-53-routinebuildertsx--конструктор-программ)
   - [5.4 Dashboard.tsx -- обновлённая главная](#p2-54-dashboardtsx--обновлённая-главная)
   - [5.5 App.tsx -- навигация между страницами](#p2-55-apptsx--навигация-между-страницами)
6. [Дизайн и тема оформления](#p2-6-дизайн-и-тема-оформления)
   - [6.1 Тёмная тема по умолчанию](#p2-61-тёмная-тема-по-умолчанию)
   - [6.2 Цветовая палитра](#p2-62-цветовая-палитра)
   - [6.3 Шрифты](#p2-63-шрифты)
7. [Аутентификация: JWKS вместо HS256](#p2-7-аутентификация-jwks-вместо-hs256)
8. [Как всё работает вместе](#p2-8-как-всё-работает-вместе)

---

## P2-1. Обзор Phase 2

В Phase 2 мы превращаем "скелет" приложения в работающий продукт с тремя ключевыми возможностями:

| Функция | Что даёт пользователю |
|---|---|
| **Библиотека упражнений** | Просмотр 31 предустановленного упражнения, поиск, фильтрация по группам мышц, добавление своих |
| **Конструктор программ** | Создание программ тренировок из упражнений, настройка подходов/повторений, изменение порядка |
| **Шаблоны тренировок** | 6 готовых программ (Push/Pull/Legs, Full Body, Upper/Lower), которые можно скопировать и настроить |

**Новые технические концепции Phase 2:**
- **FastAPI Router** -- разделение API на модули
- **Pydantic BaseModel** -- схемы запросов/ответов, отдельные от моделей БД
- **JWKS (JSON Web Key Set)** -- динамическая проверка JWT через публичные ключи
- **Управление состоянием** -- навигация между страницами через `useState`

---

## P2-2. Новые файлы и структура

```
workout-tracker/
├── backend/
│   └── app/
│       ├── main.py                    # Обновлён: регистрация роутеров + seed шаблонов
│       ├── auth/
│       │   └── supabase.py            # Обновлён: поддержка JWKS (ES256)
│       ├── routers/
│       │   ├── exercises.py           # НОВЫЙ: CRUD API для упражнений
│       │   └── routines.py            # НОВЫЙ: CRUD API для программ тренировок
│       └── seed/
│           └── templates.py           # НОВЫЙ: 6 шаблонов тренировок
├── frontend/
│   └── src/
│       ├── index.css                  # Обновлён: тёмная тема, новые цвета
│       ├── App.tsx                    # Обновлён: навигация, хедер
│       ├── api/
│       │   ├── client.ts              # Обновлён: поддержка 204 No Content
│       │   ├── exercises.ts           # НОВЫЙ: типы и функции для упражнений
│       │   └── routines.ts            # НОВЫЙ: типы и функции для программ
│       ├── components/ui/             # НОВЫЕ: input, card, badge, dialog, label, select, scroll-area и др.
│       └── pages/
│           ├── Login.tsx              # Обновлён: новый дизайн
│           ├── Dashboard.tsx          # Обновлён: навигационные карточки
│           ├── Exercises.tsx          # НОВЫЙ: библиотека упражнений
│           ├── Routines.tsx           # НОВЫЙ: список программ
│           └── RoutineBuilder.tsx     # НОВЫЙ: конструктор программ
```

---

## P2-3. Backend: API-роутеры

### P2-3.1 Exercises API -- CRUD упражнений

**Файл:** `backend/app/routers/exercises.py`

```python
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
```

**Ключевые концепции:**

**APIRouter** -- модульная организация API:
- `APIRouter(prefix="/api/exercises")` -- все маршруты этого роутера начинаются с `/api/exercises`
- `tags=["exercises"]` -- группировка в Swagger-документации (`/docs`)
- Вместо `@app.get(...)` используем `@router.get(...)`. Роутер потом подключается к приложению через `app.include_router(router)`

**Pydantic BaseModel vs SQLModel:**
- `ExerciseCreate` и `ExerciseUpdate` -- это **схемы запросов**, не таблицы БД. Они используют `BaseModel` (не `SQLModel` с `table=True`)
- Зачем отдельные схемы? Потому что при создании упражнения пользователь не указывает `id`, `is_custom`, `user_id` -- эти поля заполняются на сервере. Схема запроса содержит только то, что может отправить клиент
- `ExerciseUpdate` -- все поля `Optional` (`str | None = None`), потому что при обновлении можно менять только часть полей

**Эндпоинт: список упражнений с фильтрацией**

```python
@router.get("")
def list_exercises(
    muscle_group: str | None = Query(None),
    search: str | None = Query(None),
    tag: str | None = Query(None),
    user_id: str = Depends(ensure_user_exists),
    session: Session = Depends(get_session),
) -> list[Exercise]:
    query = select(Exercise).where(
        (Exercise.is_custom == False) | (Exercise.user_id == user_id)
    )
    if muscle_group:
        query = query.where(Exercise.muscle_group == muscle_group)
    if search:
        query = query.where(Exercise.name.contains(search))
    exercises = list(session.exec(query).all())
    if tag:
        exercises = [e for e in exercises if tag in (e.tags or [])]
    return exercises
```

**Разбор:**

- `Query(None)` -- параметры URL-строки. `GET /api/exercises?muscle_group=chest&search=bench` → `muscle_group="chest"`, `search="bench"`
- `Depends(ensure_user_exists)` -- цепочка DI из Phase 1. Проверяет JWT, создаёт пользователя если нужно, возвращает `user_id`
- `-> list[Exercise]` -- FastAPI автоматически сериализует список SQLModel-объектов в JSON
- Запрос отдаёт стандартные упражнения (`is_custom == False`) + пользовательские упражнения текущего пользователя
- `Exercise.name.contains(search)` -- SQL LIKE-запрос для поиска по имени
- Фильтрация по `tag` делается в Python (не в SQL), потому что `tags` хранятся как JSON-колонка в SQLite, и SQL-запрос к содержимому JSON в SQLite сложнее

**Эндпоинт: создание упражнения**

```python
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
```

- `status_code=status.HTTP_201_CREATED` -- HTTP 201 вместо 200, стандарт REST для "ресурс создан"
- `data: ExerciseCreate` -- FastAPI автоматически парсит JSON из тела запроса в Pydantic-модель. Если данные невалидны (например, отсутствует `name`), FastAPI вернёт 422 с описанием ошибки
- `is_custom=True` -- все созданные через API упражнения помечаются как пользовательские
- `session.refresh(exercise)` -- перечитывает объект из БД после `commit()`, чтобы получить сгенерированный `id`

**Эндпоинт: удаление упражнения**

```python
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
```

- `/{exercise_id}` -- **path parameter**. `DELETE /api/exercises/abc-123` → `exercise_id="abc-123"`
- `HTTP_204_NO_CONTENT` -- стандартный ответ при удалении: "успешно, тело ответа пустое"
- Защита: нельзя удалить стандартные упражнения (`is_custom == False`) или чужие (`user_id != user_id`)
- `HTTPException(status_code=403)` -- HTTP 403 Forbidden: "у вас нет прав на это действие"

---

### P2-3.2 Routines API -- CRUD программ тренировок

**Файл:** `backend/app/routers/routines.py`

```python
router = APIRouter(prefix="/api/routines", tags=["routines"])


class RoutineExerciseIn(BaseModel):
    exercise_id: str
    order: int = 0
    target_sets: int = 3
    target_reps: int = 10


class RoutineCreate(BaseModel):
    name: str
    exercises: list[RoutineExerciseIn] = []


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
```

**Зачем разные схемы для входа и выхода?**

- `RoutineExerciseIn` -- то, что **отправляет** клиент. Нет `id` (сервер генерирует), нет `routine_id` (берётся из URL)
- `RoutineExerciseOut` -- то, что **возвращает** сервер. Включает `id` для дальнейших операций
- `RoutineOut` -- полная информация о программе с вложенными упражнениями. Использует `model_validate(routine, from_attributes=True)` для конвертации SQLModel-объекта в Pydantic-модель

**Создание программы:**

```python
@router.post("", status_code=status.HTTP_201_CREATED)
def create_routine(
    data: RoutineCreate,
    user_id: str = Depends(ensure_user_exists),
    session: Session = Depends(get_session),
) -> RoutineOut:
    routine = Routine(name=data.name, user_id=user_id)
    session.add(routine)
    session.flush()  # ← важно!

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
```

**`session.flush()` vs `session.commit()`:**
- `flush()` -- отправляет SQL-запрос INSERT в БД, но **не фиксирует транзакцию**. После `flush()` у `routine` появляется `id`, который нужен для создания `RoutineExercise`
- `commit()` -- фиксирует всю транзакцию. Если что-то пойдёт не так при создании упражнений, весь `commit()` откатится, и программа без упражнений не создастся

**Обновление программы (замена упражнений):**

```python
if data.exercises is not None:
    # Удалить старые
    existing = session.exec(
        select(RoutineExercise).where(RoutineExercise.routine_id == routine_id)
    ).all()
    for e in existing:
        session.delete(e)

    # Создать новые
    for ex in data.exercises:
        re = RoutineExercise(...)
        session.add(re)
```

Стратегия "удалить всё и создать заново" -- проще, чем обновлять каждое упражнение по отдельности. В нашем масштабе (5-10 упражнений в программе) это не проблема производительности.

---

### P2-3.3 Seed шаблонов тренировок

**Файл:** `backend/app/seed/templates.py`

```python
SYSTEM_USER_ID = "system"

TEMPLATES = [
    {
        "name": "Push Day",
        "exercises": [
            ("Barbell Bench Press", 4, 8),
            ("Incline Dumbbell Press", 3, 10),
            ("Cable Crossover", 3, 12),
            ("Overhead Press", 3, 10),
            ("Lateral Raise", 3, 15),
            ("Tricep Pushdown", 3, 12),
        ],
    },
    # ... Pull Day, Leg Day, Full Body, Upper Body, Lower Body
]
```

**Как это работает:**

1. При старте сервера проверяется, есть ли уже шаблоны (`is_template == True`)
2. Если нет -- создаётся 6 программ с `user_id="system"` и `is_template=True`
3. Упражнения привязываются по **имени** через lookup-таблицу `name_to_id`
4. Шаблоны видны всем пользователям, но не могут быть удалены (только скопированы)

**`SYSTEM_USER_ID = "system"`** -- фиктивный пользователь для системных шаблонов. Ни один реальный пользователь не имеет такой ID (Supabase генерирует UUID).

---

### P2-3.4 Обновление main.py

```python
from app.seed.templates import seed_templates
from app.routers import exercises, routines

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    seed_exercises()
    seed_templates()  # ← новое
    yield

app.include_router(exercises.router)  # ← новое
app.include_router(routines.router)   # ← новое
```

- `app.include_router(router)` -- подключает роутер к приложению. Все маршруты роутера становятся доступны через приложение
- Порядок вызовов в `lifespan` важен: сначала `seed_exercises()` (заполняет библиотеку), потом `seed_templates()` (использует упражнения из библиотеки)

---

## P2-4. Frontend: API-клиенты

### P2-4.1 exercises.ts -- типы и функции

**Файл:** `frontend/src/api/exercises.ts`

```typescript
export interface Exercise {
  id: string
  name: string
  description: string
  muscle_group: string
  tags: string[]
  is_custom: boolean
  user_id: string | null
}

export interface ExerciseCreate {
  name: string
  description?: string
  muscle_group: string
  tags?: string[]
}

export function fetchExercises(params?: {
  muscle_group?: string
  search?: string
  tag?: string
}): Promise<Exercise[]> {
  const query = new URLSearchParams()
  if (params?.muscle_group) query.set('muscle_group', params.muscle_group)
  if (params?.search) query.set('search', params.search)
  if (params?.tag) query.set('tag', params.tag)
  const qs = query.toString()
  return apiFetch<Exercise[]>(`/exercises${qs ? `?${qs}` : ''}`)
}

export function createExercise(data: ExerciseCreate): Promise<Exercise> {
  return apiFetch<Exercise>('/exercises', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function deleteExercise(id: string): Promise<void> {
  return apiFetch('/exercises/' + id, { method: 'DELETE' })
}
```

**Что здесь нового:**

- **TypeScript interfaces** -- описывают структуру данных. `Exercise` соответствует модели на бэкенде. TypeScript проверяет, что мы правильно используем эти поля
- `ExerciseCreate` -- поля со знаком `?` опциональны (можно не передавать)
- `URLSearchParams` -- встроенный класс браузера для формирования строки запроса. Автоматически экранирует специальные символы
- `JSON.stringify(data)` -- конвертирует объект в JSON-строку для тела POST-запроса

### P2-4.2 routines.ts -- типы и функции

Аналогичная структура: интерфейсы для типов, функции для каждой операции (fetch, create, update, delete).

### P2-4.3 Исправление client.ts для DELETE-запросов

```typescript
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // ...
  if (response.status === 204) return undefined as T  // ← новое
  return response.json()
}
```

**Зачем?** DELETE-эндпоинты возвращают HTTP 204 с пустым телом. Вызов `response.json()` на пустом ответе выбрасывает исключение. Проверка `status === 204` возвращает `undefined` без попытки парсинга JSON.

---

## P2-5. Frontend: страницы

### P2-5.1 Exercises.tsx -- библиотека упражнений

Страница библиотеки упражнений -- самая насыщенная в Phase 2. Разберём ключевые паттерны:

**Загрузка данных:**

```tsx
const [exercises, setExercises] = useState<Exercise[]>([])
const [loading, setLoading] = useState(true)

const load = async () => {
  try {
    const data = await fetchExercises()
    setExercises(data)
  } catch (err) {
    console.error('Failed to load exercises', err)
  } finally {
    setLoading(false)
  }
}

useEffect(() => { load() }, [])
```

- `useState<Exercise[]>([])` -- массив упражнений, изначально пустой
- `useEffect(() => { load() }, [])` -- загружает данные при первом отображении страницы. Пустой массив зависимостей `[]` означает "выполнить один раз"
- `try/catch/finally` -- обработка ошибок. `finally` гарантирует, что `loading` станет `false` даже при ошибке

**Фильтрация с useMemo:**

```tsx
const filtered = useMemo(() => {
  return exercises.filter((e) => {
    if (muscleFilter !== 'all' && e.muscle_group !== muscleFilter) return false
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })
}, [exercises, search, muscleFilter])
```

- `useMemo` -- **мемоизация**. React пересчитывает фильтрованный список только когда изменяются `exercises`, `search` или `muscleFilter`. Без `useMemo` фильтрация выполнялась бы при каждом рендере компонента (включая изменения несвязанных состояний)
- `.filter()` -- создаёт новый массив, включая только элементы, для которых функция вернула `true`
- `.toLowerCase()` -- регистронезависимый поиск

**Цветовое кодирование мышечных групп:**

```tsx
const MUSCLE_COLORS: Record<string, string> = {
  chest: 'bg-red-500/15 text-red-400 ring-red-500/20',
  back: 'bg-blue-500/15 text-blue-400 ring-blue-500/20',
  legs: 'bg-green-500/15 text-green-400 ring-green-500/20',
  // ...
}
```

- `Record<string, string>` -- TypeScript тип: объект со строковыми ключами и значениями
- `/15` в `bg-red-500/15` -- прозрачность в Tailwind CSS (15% непрозрачности). Создаёт приглушённый фон для бейджей

**Фильтры-таблетки вместо выпадающего списка:**

```tsx
<div className="flex flex-wrap gap-1.5">
  {MUSCLE_GROUPS.map((g) => (
    <button
      key={g}
      onClick={() => setMuscleFilter(g)}
      className={`... ${
        muscleFilter === g
          ? 'bg-warm/15 text-warm ring-1 ring-warm/30'
          : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
      }`}
    >
      {g === 'all' ? 'All' : g.charAt(0).toUpperCase() + g.slice(1)}
    </button>
  ))}
</div>
```

Условные CSS-классы через template literals: активный фильтр получает тёплый акцент, неактивные -- приглушённые цвета.

---

### P2-5.2 Routines.tsx -- список программ

**Разделение на пользовательские и шаблоны:**

```tsx
const templates = routines.filter((r) => r.is_template)
const custom = routines.filter((r) => !r.is_template)
```

Шаблоны отображаются отдельным блоком с визуальным разделителем:

```tsx
<div className="flex items-center gap-2">
  <div className="h-px flex-1 bg-border/50" />
  <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
    Templates
  </span>
  <div className="h-px flex-1 bg-border/50" />
</div>
```

Этот паттерн создаёт горизонтальную линию с текстом посередине -- элегантный разделитель секций.

**Компонент RoutineCard:**

```tsx
function RoutineCard({ routine, exercises, onEdit, onDelete }: {...}) {
  const sorted = [...routine.routine_exercises].sort((a, b) => a.order - b.order)

  return (
    <div className="group rounded-xl border ...">
      {/* ... */}
      {sorted.slice(0, 4).map((re) => (
        <span className="text-xs text-muted-foreground">
          {ex?.name} <span className="text-warm/60">{re.target_sets}x{re.target_reps}</span>
        </span>
      ))}
      {sorted.length > 4 && (
        <span className="text-xs text-muted-foreground/50">+{sorted.length - 4} more</span>
      )}
    </div>
  )
}
```

- `[...array].sort()` -- spread-оператор создаёт копию массива перед сортировкой (`.sort()` мутирует оригинал)
- `.slice(0, 4)` -- показываем только первые 4 упражнения, чтобы карточка не была слишком длинной
- `className="group ..."` + `group-hover:opacity-100` на кнопке удаления -- кнопка появляется только при наведении на карточку (паттерн Tailwind `group`)

---

### P2-5.3 RoutineBuilder.tsx -- конструктор программ

Самый сложный компонент Phase 2. Три режима работы:
1. **Новая программа** -- пустое имя, пустой список
2. **Редактирование** -- загружает существующую программу
3. **Использование шаблона** -- загружает шаблон, но при сохранении создаёт копию

**Состояние конструктора:**

```tsx
interface RoutineExerciseRow {
  exercise_id: string
  exercise_name: string  // для отображения, чтобы не делать lookup каждый раз
  target_sets: number
  target_reps: number
}

const [rows, setRows] = useState<RoutineExerciseRow[]>([])
```

**Перемещение упражнений:**

```tsx
const moveExercise = (index: number, direction: -1 | 1) => {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= rows.length) return
  setRows((prev) => {
    const next = [...prev]
    ;[next[index], next[newIndex]] = [next[newIndex], next[index]]
    return next
  })
}
```

- `direction: -1 | 1` -- TypeScript literal type: аргумент может быть только `-1` (вверх) или `1` (вниз)
- `[next[index], next[newIndex]] = [next[newIndex], next[index]]` -- **деструктурирующее присваивание** для обмена элементов местами
- `;[` -- точка с запятой перед `[` нужна, потому что без неё JavaScript считает `[` продолжением предыдущей строки

**Диалог выбора упражнения:**

```tsx
<Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
  <Button onClick={() => setPickerOpen(true)}>Add</Button>
  <DialogContent>
    {/* Поиск + фильтр */}
    <ScrollArea className="h-[300px]">
      {filteredExercises.map((exercise) => (
        <button onClick={() => addExercise(exercise)}>
          {exercise.name}
        </button>
      ))}
    </ScrollArea>
  </DialogContent>
</Dialog>
```

- `Dialog` (из shadcn/ui) -- модальное окно. `open` и `onOpenChange` управляют его видимостью
- `ScrollArea` -- прокручиваемая область фиксированной высоты (300px). Если упражнений много, список скроллится внутри диалога
- Мы **не** используем `DialogTrigger` с `asChild`, потому что shadcn/ui base-nova использует base-ui, где `DialogTrigger` рендерит `<button>`, и вложенный `<Button>` создаёт невалидный HTML (`<button>` внутри `<button>`). Вместо этого управляем `open` вручную

**Логика сохранения:**

```tsx
if (routineId && !isTemplate) {
  await updateRoutine(routineId, { name, exercises: exerciseData })
} else {
  await createRoutine({
    name: isTemplate ? `${name} (Copy)` : name,
    exercises: exerciseData
  })
}
```

При использовании шаблона создаётся новая программа (не перезаписывается шаблон), с суффиксом "(Copy)" в названии.

---

### P2-5.4 Dashboard.tsx -- обновлённая главная

Вместо текстовой заглушки -- навигационные карточки:

```tsx
<button
  onClick={() => onNavigate('exercises')}
  className="group relative overflow-hidden rounded-xl border ..."
>
  <div className="absolute inset-0 bg-gradient-to-br from-warm/5 to-transparent
    opacity-0 transition-opacity group-hover:opacity-100" />
  <div className="relative">
    {/* иконка, заголовок, описание */}
    <ArrowRight className="... transition-transform group-hover:translate-x-1" />
  </div>
</button>
```

**Эффект при наведении:**
- `group` на кнопке + `group-hover:opacity-100` на градиенте -- при наведении появляется тёплый градиент
- `group-hover:translate-x-1` на стрелке -- стрелка сдвигается вправо
- `absolute inset-0` -- градиент занимает всю площадь карточки
- `relative` на контенте -- контент поверх градиента (z-стекинг)

---

### P2-5.5 App.tsx -- навигация между страницами

```tsx
type Page = 'dashboard' | 'exercises' | 'routines' | 'routine-builder'

const [page, setPage] = useState<Page>('dashboard')
const [editRoutineId, setEditRoutineId] = useState<string | null>(null)
```

**Почему не react-router-dom?**

Хотя `react-router-dom` установлен, в Phase 2 мы используем простую навигацию через `useState`. Для приложения с 4-5 страницами без вложенных маршрутов и без необходимости URL-истории это проще и достаточно. URL-маршрутизация будет добавлена в следующих фазах, когда появятся глубокие ссылки (например, `/session/abc-123`).

**Хедер с навигацией:**

```tsx
<header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-xl">
```

- `sticky top-0` -- хедер "прилипает" к верху экрана при прокрутке
- `bg-background/80` -- 80% непрозрачности фона
- `backdrop-blur-xl` -- размытие контента под хедером. В сочетании с полупрозрачным фоном создаёт "стеклянный" эффект

---

## P2-6. Дизайн и тема оформления

### P2-6.1 Тёмная тема по умолчанию

В Phase 1 приложение использовало светлую тему с `.dark` классом для тёмной. Проблема: `.dark` класс никогда не применялся, и при тёмных настройках системы пользователь видел белые элементы.

**Решение:** переписали `:root` CSS-переменные на тёмные значения по умолчанию. Теперь `.dark` класс не нужен -- приложение всегда тёмное.

### P2-6.2 Цветовая палитра

```css
:root {
    --background: oklch(0.13 0.005 250);    /* глубокий тёмно-синий */
    --card: oklch(0.17 0.005 250);           /* чуть светлее для карточек */
    --primary: oklch(0.78 0.12 70);          /* тёплый янтарный акцент */
    --border: oklch(0.25 0.008 250);         /* тонкие границы */
    --muted-foreground: oklch(0.60 0.015 250); /* приглушённый текст */
}
```

**oklch** -- современное цветовое пространство CSS:
- `L` -- светлость (0 = чёрный, 1 = белый)
- `C` -- насыщенность (0 = серый, 0.4 = максимально яркий)
- `H` -- оттенок (0-360: 0 = красный, 70 = янтарный, 250 = синий)

Почему `oklch`? Более равномерное восприятие цветов человеком по сравнению с `hsl` или `rgb`. Два цвета с одинаковой `L` (светлостью) выглядят одинаково яркими.

**Пользовательская CSS-переменная `--warm`:**

```css
--warm: oklch(0.78 0.12 70);
--warm-foreground: oklch(0.13 0.005 250);
```

Добавлена в `@theme inline` как `--color-warm: var(--warm)`, что позволяет использовать `text-warm`, `bg-warm/10`, `ring-warm/30` в Tailwind CSS.

### P2-6.3 Шрифты

```css
@import "@fontsource-variable/instrument-sans";
@import "@fontsource-variable/geist";

--font-heading: 'Instrument Sans Variable', sans-serif;
--font-sans: 'Geist Variable', sans-serif;
```

- **Instrument Sans** -- для заголовков (`font-heading`). Более характерный, чем Geist
- **Geist** -- для основного текста. Чистый, нейтральный

Использование: `className="font-heading text-xl font-bold tracking-tight"`

---

## P2-7. Аутентификация: JWKS вместо HS256

В Phase 1 мы использовали `algorithms=["HS256"]` и `SUPABASE_JWT_SECRET` для проверки токенов. Но Supabase может использовать **ES256** (алгоритм на эллиптических кривых). При попытке проверить ES256-токен с HS256 возникала ошибка: `The specified alg value is not allowed`.

**Решение: JWKS (JSON Web Key Set)**

```python
import httpx
from jose import jwt, jwk
from functools import lru_cache

@lru_cache
def get_jwks():
    settings = get_settings()
    url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
    response = httpx.get(url)
    return response.json()

def get_public_key(token: str):
    header = jwt.get_unverified_header(token)
    jwks = get_jwks()
    for key_data in jwks["keys"]:
        if key_data.get("kid") == header.get("kid"):
            return jwk.construct(key_data, algorithm=header["alg"])
    raise ValueError("No matching key found in JWKS")
```

**Как это работает:**

1. `get_jwks()` -- скачивает публичные ключи Supabase с известного URL. `@lru_cache` кэширует результат -- запрос к Supabase делается только один раз за время жизни сервера
2. `jwt.get_unverified_header(token)` -- извлекает заголовок JWT **без проверки подписи**, чтобы узнать алгоритм (`alg`) и идентификатор ключа (`kid`)
3. `get_public_key()` -- находит нужный ключ в JWKS по `kid` и конструирует объект для проверки
4. `jwt.decode(token, public_key, algorithms=[alg])` -- проверяет подпись с правильным ключом

**JWKS vs JWT Secret:**
- **JWT Secret** (HS256) -- один секретный ключ, хранится на сервере. Симметричное шифрование: один ключ для создания и проверки
- **JWKS** (ES256) -- пара ключей: приватный (у Supabase) и публичный (доступен всем). Асимметричное шифрование: приватный ключ создаёт подпись, публичный -- проверяет. Безопаснее, потому что публичный ключ нельзя использовать для подделки токенов

Код автоматически определяет алгоритм из заголовка токена и использует правильный метод проверки.

---

## P2-8. Как всё работает вместе

```
1. Сервер стартует
   → create_db_and_tables() -- создаёт/проверяет таблицы
   → seed_exercises() -- 31 упражнение (если пусто)
   → seed_templates() -- 6 шаблонов (если пусто)
   → include_router(exercises) -- регистрирует /api/exercises/*
   → include_router(routines) -- регистрирует /api/routines/*

2. Пользователь входит в приложение
   → Login.tsx → Supabase Auth → JWT-токен (ES256)
   → useAuth() обновляет состояние → App.tsx показывает Dashboard

3. Пользователь открывает библиотеку упражнений
   → App.tsx: setPage('exercises') → рендерит Exercises.tsx
   → fetchExercises() → apiFetch('/exercises')
   → Vite proxy → http://localhost:8000/api/exercises
   → FastAPI: ensure_user_exists → JWKS-проверка JWT → user_id
   → SQL: SELECT * FROM exercise WHERE is_custom=0 OR user_id=?
   → JSON-ответ → React обновляет UI

4. Пользователь создаёт программу тренировок
   → Routines.tsx: onNew() → setPage('routine-builder')
   → RoutineBuilder.tsx: вводит имя, добавляет упражнения через диалог
   → handleSave() → createRoutine({ name, exercises })
   → POST /api/routines → INSERT routine + INSERT routine_exercise (x N)
   → onBack() → возврат к списку программ

5. Пользователь использует шаблон
   → Routines.tsx: onEdit(templateId) → setPage('routine-builder')
   → fetchRoutine(templateId) → загружает шаблон с упражнениями
   → Пользователь меняет подходы/повторения, добавляет/удаляет упражнения
   → handleSave() → createRoutine() (не updateRoutine!) → создаёт КОПИЮ
   → Оригинальный шаблон не изменяется
```

---

# Phase 3: Workout Logging -- Запись тренировок

## Содержание

1. [Обзор Phase 3](#1-обзор-phase-3)
2. [Backend: Sessions API](#2-backend-sessions-api)
   - [2.1 Модели данных (напоминание)](#21-модели-данных-напоминание)
   - [2.2 Pydantic-схемы запросов и ответов](#22-pydantic-схемы-запросов-и-ответов)
   - [2.3 Эндпоинты sessions.py](#23-эндпоинты-sessionspy)
   - [2.4 Регистрация роутера](#24-регистрация-роутера)
3. [Frontend: API-клиент для сессий](#3-frontend-api-клиент-для-сессий)
4. [Frontend: Страница ActiveSession](#4-frontend-страница-activesession)
   - [4.1 Архитектура компонента](#41-архитектура-компонента)
   - [4.2 Таймер тренировки](#42-таймер-тренировки)
   - [4.3 Логирование подходов (SetRow)](#43-логирование-подходов-setrow)
   - [4.4 Добавление упражнений во время тренировки](#44-добавление-упражнений-во-время-тренировки)
   - [4.5 Завершение тренировки](#45-завершение-тренировки)
5. [Frontend: Обновление Dashboard](#5-frontend-обновление-dashboard)
6. [Frontend: Обновление App.tsx](#6-frontend-обновление-apptsx)
7. [Изображения упражнений](#7-изображения-упражнений)
   - [7.1 image_url в модели Exercise](#71-image_url-в-модели-exercise)
   - [7.2 Миграция БД (ALTER TABLE)](#72-миграция-бд-alter-table)
   - [7.3 Загрузка изображений из wger.de](#73-загрузка-изображений-из-wgerde)
   - [7.4 Статические файлы в FastAPI](#74-статические-файлы-в-fastapi)
8. [Как всё работает вместе](#8-как-всё-работает-вместе)

---

## 1. Обзор Phase 3

Phase 3 добавляет ключевую функциональность — **запись тренировок в реальном времени**:

- **Начать тренировку** — из выбранной программы (routine) или с чистого листа (ad-hoc)
- **Активная сессия** — логировать подходы (вес + повторения), добавлять упражнения по ходу
- **Завершить** — сессия сохраняется в истории с таймстемпом

Также в рамках Phase 3 были добавлены **изображения упражнений** (из открытой базы wger.de) и **автомиграция** БД для новых колонок.

### Новые файлы

```
backend/
├── app/
│   ├── routers/sessions.py          # CRUD API для тренировочных сессий
│   ├── static/exercises/            # Изображения упражнений (PNG/JPG/WebP)
│   └── database.py                  # Обновлён: автомиграция новых колонок
├── scripts/
│   └── download_exercise_images.py  # Одноразовый скрипт загрузки картинок
frontend/
├── src/
│   ├── api/sessions.ts              # Fetch-обёртки для sessions API
│   ├── pages/ActiveSession.tsx      # UI активной тренировки
│   ├── pages/Dashboard.tsx          # Обновлён: карточки старта тренировки
│   └── App.tsx                      # Обновлён: роутинг active-session
```

---

## 2. Backend: Sessions API

### 2.1 Модели данных (напоминание)

Три таблицы для тренировочных сессий (определены в Phase 1, `backend/app/models/session.py`):

```python
class WorkoutSession(SQLModel, table=True):
    __tablename__ = "workout_session"
    id: str          # UUID
    user_id: str     # привязка к пользователю
    routine_id: str | None  # если начата из программы
    started_at: datetime    # автоматически при создании
    completed_at: datetime | None  # заполняется при завершении
    notes: str
    exercises: list[SessionExercise]  # связь 1:N

class SessionExercise(SQLModel, table=True):
    __tablename__ = "session_exercise"
    id: str
    session_id: str     # FK → workout_session
    exercise_id: str    # FK → exercise
    order: int
    sets: list[ExerciseSet]  # связь 1:N

class ExerciseSet(SQLModel, table=True):
    __tablename__ = "exercise_set"
    id: str
    session_exercise_id: str  # FK → session_exercise
    set_number: int
    reps: int
    weight: float
    notes: str
```

**Иерархия:** `WorkoutSession` → `SessionExercise` (список упражнений) → `ExerciseSet` (подходы каждого упражнения).

### 2.2 Pydantic-схемы запросов и ответов

В `backend/app/routers/sessions.py` определены отдельные Pydantic-модели:

**Входящие (request):**

```python
class SessionCreate(BaseModel):
    routine_id: str | None = None   # если из программы
    notes: str = ""
    exercises: list[SessionExerciseIn] = []  # для ad-hoc

class AddExerciseIn(BaseModel):
    exercise_id: str
    order: int = 0

class LogSetIn(BaseModel):
    set_number: int
    reps: int = 0
    weight: float = 0.0
    notes: str = ""
```

**Исходящие (response):**

```python
class SessionOut(BaseModel):
    id: str
    user_id: str
    routine_id: str | None
    started_at: datetime
    completed_at: datetime | None
    notes: str
    exercises: list[SessionExerciseOut]  # вложенные упражнения с подходами
```

**Ключевой принцип:** каждый эндпоинт возвращает полный `SessionOut` — фронтенд всегда получает актуальное состояние сессии после любого действия.

### 2.3 Эндпоинты sessions.py

| Метод | URL | Назначение |
|---|---|---|
| `POST` | `/api/sessions` | Создать сессию (из routine или пустую) |
| `GET` | `/api/sessions` | Список сессий пользователя |
| `GET` | `/api/sessions/{id}` | Детали конкретной сессии |
| `POST` | `/api/sessions/{id}/exercises` | Добавить упражнение во время тренировки |
| `POST` | `/api/sessions/{id}/exercises/{se_id}/sets` | Записать/обновить подход |
| `PUT` | `/api/sessions/{id}/complete` | Завершить сессию |
| `DELETE` | `/api/sessions/{id}` | Удалить сессию |

#### Создание сессии из программы (routine)

```python
@router.post("", status_code=status.HTTP_201_CREATED)
def create_session(data: SessionCreate, ...):
    ws = WorkoutSession(user_id=user_id, routine_id=data.routine_id)
    session.add(ws)
    session.flush()  # получаем ws.id до commit

    if data.routine_id and not data.exercises:
        # Авто-заполнение из routine
        routine_exercises = session.exec(
            select(RoutineExercise)
            .where(RoutineExercise.routine_id == data.routine_id)
        ).all()
        for re in routine_exercises:
            se = SessionExercise(session_id=ws.id, exercise_id=re.exercise_id)
            session.add(se)
            session.flush()
            # Создаём пустые подходы по target_sets из routine
            for i in range(1, re.target_sets + 1):
                session.add(ExerciseSet(
                    session_exercise_id=se.id,
                    set_number=i, reps=0, weight=0.0
                ))
    session.commit()
```

**Важный паттерн:** `session.flush()` отправляет SQL (INSERT) без commit — нужно для получения `ws.id` и `se.id`, которые являются FK для дочерних записей. `session.commit()` вызывается один раз в конце.

#### Логирование подхода (upsert)

```python
@router.post("/{session_id}/exercises/{session_exercise_id}/sets")
def log_set(session_id, session_exercise_id, data: LogSetIn, ...):
    # Проверяем, существует ли подход с таким номером
    existing_set = session.exec(
        select(ExerciseSet).where(
            ExerciseSet.session_exercise_id == session_exercise_id,
            ExerciseSet.set_number == data.set_number,
        )
    ).first()

    if existing_set:
        # Обновляем существующий
        existing_set.reps = data.reps
        existing_set.weight = data.weight
    else:
        # Создаём новый
        session.add(ExerciseSet(...))
```

Это **upsert-паттерн** — если подход с таким `set_number` уже есть, обновляем его. Если нет — создаём. Позволяет фронтенду просто отправлять данные, не думая о том, новый это подход или исправление.

### 2.4 Регистрация роутера

В `backend/app/main.py`:

```python
from app.routers import exercises, routines, sessions

app.include_router(sessions.router)
```

---

## 3. Frontend: API-клиент для сессий

`frontend/src/api/sessions.ts` — TypeScript-обёртки:

```typescript
export interface WorkoutSession {
  id: string
  user_id: string
  routine_id: string | null
  started_at: string       // ISO datetime
  completed_at: string | null
  notes: string
  exercises: SessionExercise[]
}

// Основные функции:
export function createSession(data: SessionCreate): Promise<WorkoutSession>
export function fetchSession(id: string): Promise<WorkoutSession>
export function logSet(sessionId, sessionExerciseId, data): Promise<WorkoutSession>
export function addExerciseToSession(sessionId, exerciseId): Promise<WorkoutSession>
export function completeSession(sessionId): Promise<WorkoutSession>
export function deleteSession(sessionId): Promise<void>
```

**Паттерн:** все мутирующие функции (logSet, addExercise, complete) возвращают обновлённый `WorkoutSession` — фронтенд просто вызывает `setSession(updated)`, не нужен отдельный refetch.

---

## 4. Frontend: Страница ActiveSession

### 4.1 Архитектура компонента

`frontend/src/pages/ActiveSession.tsx` — главный компонент тренировки:

```
ActiveSession
├── Stats bar (таймер, прогресс подходов, кол-во упражнений)
├── Exercise cards (аккордеон)
│   ├── Exercise header (название, muscle group, прогресс-точки)
│   └── Set rows (при раскрытии)
│       ├── SetRow (вес, повторения, кнопка ✓)
│       └── "+ Add Set" кнопка
├── "+ Add Exercise" кнопка (открывает picker диалог)
└── "Finish Workout" кнопка
```

**Props:**

```typescript
interface ActiveSessionProps {
  sessionId: string     // ID активной сессии
  onComplete: () => void  // callback при завершении
  onBack: () => void      // callback при отмене
}
```

### 4.2 Таймер тренировки

```typescript
useEffect(() => {
  if (!session) return
  // Парсим started_at как UTC (бэкенд сохраняет datetime.utcnow())
  const raw = session.started_at
  const startTime = new Date(
    raw.endsWith('Z') || raw.includes('+') ? raw : raw + 'Z'
  ).getTime()
  const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000))
  tick()
  const interval = setInterval(tick, 1000)
  return () => clearInterval(interval)
}, [session?.started_at])
```

**Важный нюанс:** Python `datetime.utcnow()` создаёт "наивный" datetime без информации о таймзоне. При сериализации получается строка вида `"2026-03-26T14:00:00"` без суффикса `Z`. Браузер интерпретирует такое как **локальное время**, а не UTC. Решение — добавляем `Z` при парсинге, чтобы принудительно указать UTC.

### 4.3 Логирование подходов (SetRow)

`SetRow` — отдельный компонент для одного подхода:

```typescript
function SetRow({ setNumber, initialWeight, initialReps, isLogged, onLog }) {
  const [weight, setWeight] = useState(initialWeight.toString())
  const [reps, setReps] = useState(initialReps.toString())
  const [saved, setSaved] = useState(isLogged)

  const handleSave = () => {
    const r = parseInt(reps) || 0
    const w = parseFloat(weight) || 0
    if (r <= 0) return  // нельзя сохранить 0 повторений
    onLog(r, w)
    setSaved(true)
  }
  // ... рендерит: [номер] [input вес] [input повторения] [кнопка ✓]
}
```

**UX-дизайн:** при нажатии ✓ строка подсвечивается (bg-warm/5), точка в прогрессе становится оранжевой. Это даёт мгновенную обратную связь без ожидания ответа сервера.

### 4.4 Добавление упражнений во время тренировки

Тот же паттерн exercise picker (Dialog + Search + Select), что и в RoutineBuilder:

```typescript
const handleAddExercise = async (exercise: Exercise) => {
  const updated = await addExerciseToSession(sessionId, exercise.id)
  setSession(updated)  // обновляем всю сессию
  // Автоматически раскрываем новое упражнение
  const newEx = updated.exercises[updated.exercises.length - 1]
  if (newEx) setExpandedExercise(newEx.id)
}
```

Бэкенд автоматически определяет `order` (максимальный + 1) и создаёт один пустой подход.

### 4.5 Завершение тренировки

```typescript
const handleComplete = async () => {
  await completeSession(sessionId)  // PUT /api/sessions/{id}/complete
  onComplete()  // возврат на Dashboard
}
```

Бэкенд устанавливает `completed_at = datetime.utcnow()`.

---

## 5. Frontend: Обновление Dashboard

Dashboard (`frontend/src/pages/Dashboard.tsx`) получил две новые карточки:

1. **Start Workout** — открывает диалог выбора routine:

```typescript
const handleStartFromRoutine = async (routineId: string) => {
  const session = await createSession({ routine_id: routineId })
  onStartSession(session.id)  // переход на ActiveSession
}
```

2. **Quick Start** — создаёт пустую сессию:

```typescript
const handleStartAdHoc = async () => {
  const session = await createSession({})  // без routine_id
  onStartSession(session.id)
}
```

**Диалог выбора routine** — загружает список программ при монтировании, показывает название, кол-во упражнений, badge "Template".

### Новый prop

```typescript
interface DashboardProps {
  onNavigate: (page: string) => void
  onStartSession: (sessionId: string) => void  // новый
}
```

---

## 6. Frontend: Обновление App.tsx

```typescript
type Page = 'dashboard' | 'exercises' | 'routines' | 'routine-builder' | 'active-session'

// Новое состояние:
const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

const startSession = (sessionId: string) => {
  setActiveSessionId(sessionId)
  setPage('active-session')
}
```

**Скрытие навигации:** во время активной тренировки header скрыт — пользователь сфокусирован на логировании:

```tsx
{page !== 'active-session' && (
  <header>...</header>
)}
```

---

## 7. Изображения упражнений

### 7.1 image_url в модели Exercise

Добавлено новое поле в `backend/app/models/exercise.py`:

```python
class Exercise(SQLModel, table=True):
    # ... существующие поля ...
    image_url: str | None = Field(default=None)  # новое
```

И в TypeScript-интерфейсе `frontend/src/api/exercises.ts`:

```typescript
export interface Exercise {
  // ... существующие поля ...
  image_url: string | null  // новое
}
```

### 7.2 Миграция БД (ALTER TABLE)

**Проблема:** SQLModel/SQLAlchemy `create_all()` создаёт только **новые таблицы**. Если таблица уже существует, новые колонки не добавляются.

**Решение** — автомиграция в `backend/app/database.py`:

```python
def _run_migrations():
    """Добавляет колонки, которые появились после создания таблицы."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("PRAGMA table_info(exercise)")
    columns = {row[1] for row in cursor.fetchall()}

    if "image_url" not in columns:
        cursor.execute("ALTER TABLE exercise ADD COLUMN image_url TEXT")
        conn.commit()

    conn.close()
```

`PRAGMA table_info(table_name)` — SQLite-специфичная команда, возвращает список колонок таблицы. Если нужной колонки нет — добавляем через `ALTER TABLE`.

Вызывается в `create_db_and_tables()` после `SQLModel.metadata.create_all()`.

### 7.3 Загрузка изображений из wger.de

**wger.de** — открытая фитнес-платформа (AGPL лицензия) с API и изображениями упражнений.

Одноразовый скрипт `backend/scripts/download_exercise_images.py`:

```python
# 1. Ищем упражнение по имени через API:
url = f"https://wger.de/api/v2/exercise/search/?term={term}&language=english"
# Ответ содержит image URL:
# {"suggestions": [{"data": {"image": "/media/exercise-images/192/..."}}]}

# 2. Скачиваем изображение:
urllib.request.urlopen(WGER_BASE + image_path)

# 3. Сохраняем локально:
# backend/app/static/exercises/barbell-bench-press.png
```

Результат — 30 из 31 упражнения получили изображения (Ab Wheel Rollout использует SVG-заглушку).

**Seed loader** (`backend/app/seed/loader.py`) обновляет `image_url` у существующих записей при каждом запуске:

```python
if ex and data.get("image_url") and ex.image_url != data["image_url"]:
    ex.image_url = data["image_url"]
```

### 7.4 Статические файлы в FastAPI

```python
from fastapi.staticfiles import StaticFiles

app.mount("/static", StaticFiles(directory="app/static"), name="static")
```

Это позволяет обращаться к изображениям по URL `/static/exercises/barbell-bench-press.png`.

В Vite dev-режиме нужен proxy:

```typescript
// frontend/vite.config.ts
server: {
  proxy: {
    '/api': 'http://localhost:8000',
    '/static': 'http://localhost:8000',  // новое
  },
},
```

В продакшне (Docker) FastAPI обслуживает и API, и статику, и фронтенд — proxy не нужен.

---

## 8. Как всё работает вместе

```
Полный flow тренировки:

1. Dashboard: пользователь нажимает "Start Workout"
   → Открывается диалог выбора routine
   → Или "Quick Start" для пустой сессии

2. createSession({ routine_id })
   → POST /api/sessions
   → Бэкенд создаёт WorkoutSession
   → Если routine_id: копирует упражнения + пустые подходы из routine
   → Возвращает SessionOut с полной структурой

3. ActiveSession: пользователь видит список упражнений
   → Таймер тикает с момента started_at
   → Прогресс: "5/12 sets"
   → Раскрывает упражнение → видит строки подходов

4. Пользователь вводит вес и повторения, нажимает ✓
   → logSet(sessionId, exerciseId, { set_number, reps, weight })
   → POST /api/sessions/{id}/exercises/{se_id}/sets
   → Бэкенд: upsert подхода (создаёт или обновляет)
   → Фронтенд: setSession(updated) → UI обновляется

5. Добавление упражнения по ходу
   → Кнопка "+ Add Exercise" → exercise picker диалог
   → addExerciseToSession(sessionId, exerciseId)
   → POST /api/sessions/{id}/exercises
   → Бэкенд создаёт SessionExercise + 1 пустой ExerciseSet

6. Завершение
   → "Finish Workout" → completeSession(sessionId)
   → PUT /api/sessions/{id}/complete
   → Бэкенд: completed_at = datetime.utcnow()
   → Фронтенд: onComplete() → возврат на Dashboard
```

---

---

# Phase 4: History & Progress -- История и прогресс

## Содержание

1. [Обзор Phase 4](#1-обзор-phase-4)
2. [Backend: Progress Service](#2-backend-progress-service)
   - [2.1 Архитектура сервиса](#21-архитектура-сервиса)
   - [2.2 get_summary — сводная статистика](#22-get_summary--сводная-статистика)
   - [2.3 get_weekly_counts — данные для графика](#23-get_weekly_counts--данные-для-графика)
   - [2.4 get_exercise_trend — тренд по упражнению](#24-get_exercise_trend--тренд-по-упражнению)
   - [2.5 get_personal_bests — личные рекорды](#25-get_personal_bests--личные-рекорды)
3. [Backend: Progress Router](#3-backend-progress-router)
4. [Frontend: API-клиент для прогресса](#4-frontend-api-клиент-для-прогресса)
5. [Frontend: Страница History](#5-frontend-страница-history)
   - [5.1 Список завершённых тренировок](#51-список-завершённых-тренировок)
   - [5.2 Детали сессии (inline expand)](#52-детали-сессии-inline-expand)
   - [5.3 Повтор тренировки (Reuse)](#53-повтор-тренировки-reuse)
   - [5.4 Удаление тренировки](#54-удаление-тренировки)
6. [Frontend: Страница Progress](#6-frontend-страница-progress)
   - [6.1 Summary Cards — карточки статистики](#61-summary-cards--карточки-статистики)
   - [6.2 Workouts per Week — столбчатый график](#62-workouts-per-week--столбчатый-график)
   - [6.3 Exercise Trend — линейный график](#63-exercise-trend--линейный-график)
   - [6.4 Personal Bests — таблица рекордов](#64-personal-bests--таблица-рекордов)
   - [6.5 Дизайн графиков для тёмной темы](#65-дизайн-графиков-для-тёмной-темы)
7. [Frontend: Обновление навигации](#7-frontend-обновление-навигации)
8. [Как всё работает вместе](#8-как-всё-работает-вместе)

---

## 1. Обзор Phase 4

Phase 4 добавляет **историю тренировок** и **отслеживание прогресса**:

- **История** — список завершённых тренировок с деталями, возможность повторить тренировку
- **Прогресс** — сводная статистика, графики частоты тренировок и трендов по упражнениям, личные рекорды

### Новые зависимости

- **recharts** — библиотека графиков для React (BarChart, AreaChart)

### Новые файлы

```
backend/
├── app/
│   ├── routers/progress.py            # API эндпоинты прогресса
│   └── services/progress_service.py   # Бизнес-логика агрегации данных
frontend/
├── src/
│   ├── api/progress.ts                # Fetch-обёртки для progress API
│   ├── pages/History.tsx              # Страница истории тренировок
│   ├── pages/Progress.tsx             # Страница прогресса с графиками
│   ├── pages/Dashboard.tsx            # Обновлён: карточки History и Progress
│   └── App.tsx                        # Обновлён: роутинг + навигация
```

---

## 2. Backend: Progress Service

### 2.1 Архитектура сервиса

Вся логика агрегации данных вынесена в `services/progress_service.py`. Роутер (`routers/progress.py`) только вызывает функции сервиса и возвращает результат.

**Принцип:** минимум SQL-запросов. Загружаем данные один раз, агрегируем в Python.

```python
# services/progress_service.py

def _get_completed_sessions(user_id: str, session: Session) -> list[WorkoutSession]:
    """Один запрос для всех завершённых сессий пользователя."""
    return list(session.exec(
        select(WorkoutSession).where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.completed_at.is_not(None),
        )
    ).all())
```

Эта вспомогательная функция используется в `get_summary` и `get_personal_bests`, чтобы не дублировать запрос.

### 2.2 get_summary — сводная статистика

Считает все метрики за **один проход** по списку завершённых сессий:

```python
def get_summary(user_id: str, session: Session) -> dict:
    now = datetime.utcnow()
    week_start = now - timedelta(days=now.weekday())  # Понедельник
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    completed_sessions = _get_completed_sessions(user_id, session)

    total = len(completed_sessions)
    this_week = 0
    this_month = 0
    total_sets = 0
    total_volume = 0.0

    for ws in completed_sessions:
        if ws.completed_at >= week_start:
            this_week += 1
        if ws.completed_at >= month_start:
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
```

**Почему один проход?** Первая версия делала 4 отдельных SQL-запроса (total, this_week, this_month, volume). Это неэффективно — загружаем одни и те же данные 4 раза. Вместо этого: один запрос → один цикл → все метрики.

**Объём (volume)** = сумма `reps × weight` по всем подходам, где `reps > 0` (пустые подходы не считаем).

### 2.3 get_weekly_counts — данные для графика

Один запрос за весь период, затем распределение по неделям в Python:

```python
def get_weekly_counts(user_id: str, session: Session, weeks: int = 12) -> list[dict]:
    now = datetime.utcnow()
    cutoff = now - timedelta(weeks=weeks)
    # ... вычисляем начало самой ранней недели

    # Один запрос: все сессии за период
    all_ws = session.exec(
        select(WorkoutSession).where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.completed_at.is_not(None),
            WorkoutSession.completed_at >= cutoff,
        )
    ).all()

    # Создаём пустые бакеты: {"Mar 10": 0, "Mar 17": 0, ...}
    buckets: dict[str, int] = {}
    for i in range(weeks - 1, -1, -1):
        start = ...  # начало каждой недели (понедельник)
        buckets[start.strftime("%b %d")] = 0

    # Раскладываем сессии по бакетам
    for ws in all_ws:
        ws_week_start = ws.completed_at - timedelta(days=ws.completed_at.weekday())
        key = ws_week_start.strftime("%b %d")
        if key in buckets:
            buckets[key] += 1

    return [{"week": week, "count": count} for week, count in buckets.items()]
```

**Почему не 12 отдельных запросов?** Первая версия делала `session.exec(...)` в цикле для каждой недели. При `weeks=12` это 12 SQL-запросов. Сейчас — один запрос + Python-цикл.

### 2.4 get_exercise_trend — тренд по упражнению

Для конкретного упражнения показывает прогресс по сессиям:

```python
def get_exercise_trend(user_id: str, exercise_id: str, session: Session) -> list[dict]:
    sessions = session.exec(
        select(WorkoutSession).where(...)
        .order_by(WorkoutSession.completed_at.asc())
    ).all()

    trend = []
    for ws in sessions:
        # Собираем ВСЕ подходы этого упражнения в сессии
        # (упражнение может встречаться дважды в одной сессии)
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
            "date": ws.completed_at.isoformat(),
            "max_weight": best_set.weight,
            "best_reps": best_set.reps,
            "total_volume": round(total_volume, 1),
            "sets": len(all_sets),
        })

    return trend
```

**Важный момент:** упражнение может встречаться дважды в одной сессии (например, жим в начале и в конце). Мы агрегируем все подходы в одну точку данных для этой даты, а не создаём дубликаты на графике.

### 2.5 get_personal_bests — личные рекорды

Максимальный вес по каждому упражнению с batch-загрузкой имён:

```python
def get_personal_bests(user_id: str, session: Session) -> list[dict]:
    completed_sessions = _get_completed_sessions(user_id, session)

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
                        "date": ws.completed_at.isoformat(),
                    }

    # Batch-загрузка имён (один запрос вместо N)
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
```

**Оптимизация:** вместо `session.get(Exercise, id)` в цикле (N запросов) используем один `WHERE id IN (...)` запрос.

---

## 3. Backend: Progress Router

Тонкий слой между HTTP и сервисом:

```python
# routers/progress.py
from app.services.progress_service import (
    get_summary, get_weekly_counts, get_exercise_trend, get_personal_bests,
)

router = APIRouter(prefix="/api/progress", tags=["progress"])

@router.get("/summary")
def progress_summary(user_id=Depends(ensure_user_exists), session=Depends(get_session)):
    return get_summary(user_id, session)

@router.get("/weekly")
def progress_weekly(weeks: int = 12, user_id=..., session=...):
    return get_weekly_counts(user_id, session, weeks)

@router.get("/personal-bests")
def progress_personal_bests(user_id=..., session=...):
    return get_personal_bests(user_id, session)

@router.get("/exercise/{exercise_id}")
def progress_exercise(exercise_id: str, user_id=..., session=...):
    return get_exercise_trend(user_id, exercise_id, session)
```

Регистрация в `main.py`:

```python
from app.routers import exercises, routines, sessions, progress

app.include_router(progress.router)
```

---

## 4. Frontend: API-клиент для прогресса

```typescript
// api/progress.ts
export interface ProgressSummary {
  total_sessions: number
  this_week: number
  this_month: number
  total_sets: number
  total_volume: number
}

export interface WeeklyCount {
  week: string    // "Mar 10"
  count: number
}

export interface PersonalBest {
  exercise_id: string
  exercise_name: string
  muscle_group: string
  weight: number
  reps: number
  date: string    // ISO datetime
}

export interface ExerciseTrendPoint {
  date: string
  max_weight: number
  best_reps: number
  total_volume: number
  sets: number
}

export function fetchProgressSummary(): Promise<ProgressSummary>
export function fetchWeeklyCounts(weeks?: number): Promise<WeeklyCount[]>
export function fetchPersonalBests(): Promise<PersonalBest[]>
export function fetchExerciseTrend(exerciseId: string): Promise<ExerciseTrendPoint[]>
```

Каждая функция вызывает `apiFetch` с соответствующим путём. Паттерн идентичен `api/sessions.ts` и `api/exercises.ts`.

---

## 5. Frontend: Страница History

### 5.1 Список завершённых тренировок

```typescript
// pages/History.tsx
useEffect(() => {
  Promise.all([fetchSessions(), fetchExercises()])
    .then(([sessionData, exerciseData]) => {
      // Показываем только завершённые сессии
      setSessions(sessionData.filter((s) => s.completed_at))
      // Карта упражнений для отображения имён
      const map: Record<string, Exercise> = {}
      for (const e of exerciseData) map[e.id] = e
      setExercises(map)
    })
}, [])
```

Каждая карточка в списке показывает:
- Дату завершения (день недели + число)
- Время начала
- Длительность (вычисляется из `started_at` и `completed_at`)
- Количество упражнений и подходов

### 5.2 Детали сессии (inline expand)

При нажатии на карточку раскрывается блок с деталями — без перехода на отдельную страницу:

```typescript
const [expandedId, setExpandedId] = useState<string | null>(null)

// В карточке:
<button onClick={() => setExpandedId(isExpanded ? null : s.id)}>
  {/* Chevron поворачивается */}
</button>

{isExpanded && (
  <div className="border-t border-border/50 p-4">
    {/* Список упражнений с подходами */}
    {s.exercises.sort((a, b) => a.order - b.order).map((se) => (
      <div>
        <p>{exercise?.name}</p>
        {/* Бейджи подходов: "80kg × 8 reps" */}
        {loggedSets.map((set) => (
          <span className="rounded-md bg-warm/10 px-2 py-0.5 text-xs font-medium text-warm">
            {set.weight}kg × {set.reps} reps
          </span>
        ))}
      </div>
    ))}
  </div>
)}
```

### 5.3 Повтор тренировки (Reuse)

Кнопка "Repeat This Workout" клонирует структуру сессии:

```typescript
const handleReuse = async (session: WorkoutSession) => {
  const newSession = await createSession({
    routine_id: session.routine_id,
    exercises: session.exercises.map((se) => ({
      exercise_id: se.exercise_id,
      order: se.order,
      sets: se.sets.map((s) => ({
        set_number: s.set_number,
        reps: 0,              // Повторения обнуляем
        weight: s.weight,     // Вес сохраняем с прошлой тренировки
      })),
    })),
  })
  onStartSession(newSession.id)  // Переход в ActiveSession
}
```

**Ключевое решение:** последний вес предзаполняется (`weight: s.weight`), повторения обнуляются (`reps: 0`). Это удобно — пользователь видит, с каким весом работал в прошлый раз, и просто вводит повторения.

### 5.4 Удаление тренировки

```typescript
const handleDelete = async (sessionId: string) => {
  if (!confirm('Delete this workout from history?')) return
  await deleteSession(sessionId)
  setSessions((prev) => prev.filter((s) => s.id !== sessionId))
  setExpandedId(null)
}
```

Кнопка с иконкой корзины (Trash2) рядом с "Repeat This Workout". Используется `confirm()` для подтверждения.

---

## 6. Frontend: Страница Progress

### 6.1 Summary Cards — карточки статистики

Четыре карточки в сетке 2×2 (мобайл) / 4×1 (десктоп):

- **This Week** — акцентная карточка (тёплая рамка + фоновый glow)
- **This Month** — стандартная
- **Total Sessions** — стандартная
- **Total Volume** — показывает `kg` или `t` (тонны) если > 1000 кг

```typescript
function SummaryCard({ icon, label, value, accent }: { ... }) {
  return (
    <div className={`rounded-2xl border p-4 ${
      accent ? 'border-warm/20 bg-warm/[0.06]' : 'border-border/50 bg-card'
    }`}>
      {accent && (
        <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-warm/10 blur-2xl" />
      )}
      <div className="flex items-center gap-2">{icon}<span>{label}</span></div>
      <p className="mt-2 font-heading text-2xl font-bold">{value}</p>
    </div>
  )
}
```

### 6.2 Workouts per Week — столбчатый график

Используется `recharts` `BarChart` с gradient fill:

```tsx
<BarChart data={weekly}>
  <defs>
    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={CHART_COLORS.amber} stopOpacity={1} />
      <stop offset="100%" stopColor={CHART_COLORS.copper} stopOpacity={0.8} />
    </linearGradient>
  </defs>
  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridLine} vertical={false} />
  <XAxis tick={{ fill: CHART_COLORS.axisText }} />
  <YAxis allowDecimals={false} />
  <Tooltip content={<ChartTooltip />} />
  <Bar dataKey="count" fill="url(#barGradient)" radius={[6, 6, 2, 2]} />
</BarChart>
```

### 6.3 Exercise Trend — линейный график

`AreaChart` с двумя слоями:
- **Max Weight** — основная линия с заполнением (amber gradient)
- **Volume** — фоновая линия (copper gradient, более прозрачная)

```tsx
<AreaChart data={trend}>
  <defs>
    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={CHART_COLORS.amber} stopOpacity={0.25} />
      <stop offset="100%" stopColor={CHART_COLORS.amber} stopOpacity={0} />
    </linearGradient>
  </defs>
  <Area dataKey="max_weight" stroke={CHART_COLORS.amber} fill="url(#weightGradient)" />
  <Area dataKey="total_volume" stroke={CHART_COLORS.copper} fill="url(#volumeGradient)" />
</AreaChart>
```

**Dropdown упражнений:** показывает только упражнения с данными (из `bests`), а не все 50+ из библиотеки.

### 6.4 Personal Bests — таблица рекордов

Нумерованный список с ранжированием:

```tsx
{bests.map((b, i) => (
  <div className="flex items-center justify-between rounded-xl px-3 py-2.5">
    <div className="flex items-center gap-3">
      <span className="h-6 w-6 rounded-md bg-secondary text-[11px] font-semibold">
        {i + 1}
      </span>
      <div>
        <p>{b.exercise_name}</p>
        <p className="text-xs text-muted-foreground">{b.muscle_group}</p>
      </div>
    </div>
    <div>
      <p className="font-bold text-warm">{b.weight}kg × {b.reps}</p>
      <p className="text-[11px]">{formatDate(b.date)}</p>
    </div>
  </div>
))}
```

### 6.5 Дизайн графиков для тёмной темы

Главная проблема: **CSS-переменные (`hsl(var(--border))`) не работают надёжно внутри SVG** в recharts. Цвета не видны на тёмном фоне.

**Решение:** объявляем цвета как resolved oklch-значения:

```typescript
const CHART_COLORS = {
  amber: 'oklch(0.78 0.12 70)',         // --warm
  amberMuted: 'oklch(0.78 0.12 70 / 0.15)',
  copper: 'oklch(0.65 0.15 45)',         // --chart-2
  gridLine: 'oklch(0.28 0.006 250)',     // чуть светлее --border (0.25)
  axisText: 'oklch(0.55 0.01 250)',      // между muted и foreground
  tooltipBg: 'oklch(0.20 0.008 250)',    // чуть светлее card
  tooltipText: 'oklch(0.88 0.01 80)',    // почти foreground
}
```

**Кастомный Tooltip:**

```tsx
function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: CHART_COLORS.tooltipBg,
      border: `1px solid ${CHART_COLORS.tooltipBorder}`,
      borderRadius: '10px',
      boxShadow: `0 8px 32px oklch(0 0 0 / 0.4)`,
    }}>
      {payload.map((entry) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: entry.color,
            boxShadow: `0 0 6px ${entry.color}`,  // Glow-эффект
          }} />
          <span style={{ color: CHART_COLORS.tooltipText }}>{entry.value}</span>
          <span style={{ color: CHART_COLORS.axisText }}>{entry.name}</span>
        </div>
      ))}
    </div>
  )
}
```

**Визуальные улучшения:**
- Gradient fills на столбцах и area charts (amber → copper)
- Glow-эффект на точках данных при наведении
- Фоновые размытые glow-блобы за графиками (`bg-warm/[0.04] blur-3xl`)
- Скрытые вертикальные grid lines (`vertical={false}`) — чище выглядит
- `rounded-2xl` карточки с `overflow-hidden` для содержания glow-эффектов

---

## 7. Frontend: Обновление навигации

### App.tsx

```typescript
// Новые типы страниц
type Page = '...' | 'history' | 'progress'

// Новые элементы навигации
const navItems = [
  ...existing,
  { page: ['history'], icon: Clock, label: 'History', target: 'history' },
  { page: ['progress'], icon: TrendingUp, label: 'Progress', target: 'progress' },
]

// Рендеринг страниц
{page === 'history' && <History onStartSession={startSession} />}
{page === 'progress' && <Progress />}
```

### Dashboard.tsx

Добавлены две карточки быстрого доступа (тот же паттерн, что у Exercises и Routines):
- **History** — "View past workouts and repeat them"
- **Progress** — "Charts, trends, and personal bests"

---

## 8. Как всё работает вместе

```
Flow просмотра истории:

1. History: пользователь видит список завершённых тренировок
   → fetchSessions() + fetchExercises()
   → Фильтр: только completed_at !== null
   → Сортировка: newest first

2. Нажимает на карточку → раскрываются детали
   → Список упражнений с бейджами подходов
   → Кнопки: "Repeat This Workout" и 🗑️

3. "Repeat This Workout"
   → createSession({ exercises: [...] })
   → Клонирует структуру, вес сохраняется, повторения = 0
   → Переход в ActiveSession

Flow просмотра прогресса:

1. Progress: загрузка данных (3 параллельных запроса)
   → fetchProgressSummary()  → карточки статистики
   → fetchWeeklyCounts()     → столбчатый график
   → fetchPersonalBests()    → таблица рекордов + список для dropdown

2. Автовыбор первого упражнения из рекордов
   → fetchExerciseTrend(exerciseId) → area chart

3. Пользователь выбирает другое упражнение в dropdown
   → fetchExerciseTrend(newId) → график обновляется
```

---

# Phase 5: AI Sidebar -- Интеграция AI-ассистента

## Содержание Phase 5

1. [Обзор архитектуры AI](#1-обзор-архитектуры-ai)
2. [Backend: AI сервис](#2-backend-ai-сервис)
3. [Backend: AI роутер](#3-backend-ai-роутер)
4. [Frontend: API клиент](#4-frontend-api-клиент)
5. [Frontend: AI Sidebar компонент](#5-frontend-ai-sidebar-компонент)
6. [Интеграция в App.tsx](#6-интеграция-в-apptsx)
7. [Дополнение: rest_seconds в ExerciseSet](#7-дополнение-rest_seconds-в-exerciseset)
8. [Как всё работает вместе](#8-как-всё-работает-вместе-phase-5)

---

## 1. Обзор архитектуры AI

Поток данных AI-ассистента:

```
Пользователь вводит сообщение в UI
  → Frontend отправляет POST /api/ai/chat (история сообщений)
  → Backend формирует system prompt с контекстом (упражнения, сессии, рутины)
  → LiteLLM → OpenRouter → Cerebras (gpt-oss-120b)
  → Модель возвращает JSON: WorkoutAction
  → Backend парсит, выполняет действие (или запрашивает подтверждение)
  → Ответ возвращается в UI
```

**Ключевые принципы:**
- AI возвращает **структурированный JSON**, а не свободный текст
- Деструктивные действия (delete) **всегда требуют подтверждения**
- AI-фичи **опциональны** — toggle on/off сохраняется в User модели
- Ошибки AI **никогда не блокируют** основное приложение
- История чата **персистентна** через localStorage

---

## 2. Backend: AI сервис

**Файл:** `backend/app/services/ai_service.py`

### Pydantic схемы для структурированного вывода

```python
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
```

AI модель обязана вернуть JSON, соответствующий `WorkoutAction`. Четыре типа действий:
- `create_session` — создание новой тренировки
- `edit_session` — редактирование существующей
- `delete_session` — удаление (всегда `requires_confirmation: true`)
- `info` — информационный ответ без действий

### System prompt и контекст

System prompt формируется динамически с тремя подстановками:

```python
_SYSTEM_TEMPLATE = (
    "You are a workout assistant..."
    "Available exercises:\n{exercises}\n\n"
    "User's recent sessions:\n{sessions}\n\n"
    "User's routines:\n{routines}"
)
```

**Важно:** JSON-фигурные скобки в шаблоне экранируются как `{{` и `}}`, иначе `.format()` ломается.

Контекст собирается функцией `_build_context()`:
- Список всех упражнений с ID (полные UUID — иначе AI не сможет их использовать для delete)
- 5 последних завершённых сессий с упражнениями
- Все рутины пользователя

### Резолвинг упражнений по имени

AI возвращает имена упражнений текстом. Функция `_resolve_exercise()` ищет совпадение в три этапа:
1. Точное совпадение имени
2. Case-insensitive совпадение
3. Частичное совпадение (подстрока)

### Выполнение действий

Функция `execute_action()` выполняет действие против БД:
- `info` — просто возвращает summary
- `create_session` — создаёт WorkoutSession с упражнениями и сетами
- `delete_session` — каскадно удаляет sets → session_exercises → session

### Вызов LLM

```python
MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

response = await acompletion(
    model=MODEL,
    messages=llm_messages,
    response_format={"type": "json_object"},
    extra_body=EXTRA_BODY,
)
```

Используется `acompletion` (async) из litellm. Ответ парсится как JSON → WorkoutAction.

Не-деструктивные действия выполняются автоматически. Деструктивные — только после подтверждения через отдельный endpoint.

---

## 3. Backend: AI роутер

**Файл:** `backend/app/routers/ai.py`

Четыре эндпоинта:

```python
POST /api/ai/chat      # Отправка сообщения → ответ AI + действие
POST /api/ai/confirm   # Подтверждение деструктивного действия
GET  /api/ai/settings  # Получение настроек AI (ai_enabled)
PUT  /api/ai/settings  # Переключение AI on/off
```

### POST /api/ai/chat

Принимает массив сообщений (вся история чата). Проверяет `user.ai_enabled`. Вызывает `chat()` из сервиса.

### POST /api/ai/confirm

Принимает `action` (тип) и `session_id`. Выполняет ранее отложенное действие (например, delete после подтверждения пользователем).

### GET/PUT /api/ai/settings

Простой CRUD для поля `User.ai_enabled`.

**Регистрация в main.py:**
```python
from app.routers import exercises, routines, sessions, progress, ai
app.include_router(ai.router)
```

---

## 4. Frontend: API клиент

**Файл:** `frontend/src/api/ai.ts`

```typescript
interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface AIAction {
  type: 'create_session' | 'edit_session' | 'delete_session' | 'info'
  requires_confirmation: boolean
  session_id: string | null
  session_data: SessionData | null
}

interface ChatResponse {
  response: string
  action: AIAction | null
  result: { success: boolean; message: string; session_id?: string } | null
}
```

Четыре функции: `sendChatMessage()`, `confirmAction()`, `fetchAISettings()`, `updateAISettings()`.

---

## 5. Frontend: AI Sidebar компонент

**Файл:** `frontend/src/features/ai-sidebar/AISidebar.tsx`

### Архитектура UI

- **Floating button** — кнопка-триггер в правом нижнем углу (фиксированная позиция)
- **Sheet** (из shadcn/ui) — боковая панель, открывается справа
- **Один экземпляр Sheet** — ранее было два (desktop + mobile), что вызывало дублирование сообщений
- **Кнопка закрытия** — X в хедере сайдбара

### Состояние

```typescript
const [messages, setMessages] = useState<Message[]>(loadMessages)  // из localStorage
const [open, setOpen] = useState(false)
const [sending, setSending] = useState(false)
const [aiEnabled, setAiEnabled] = useState(true)
```

### Персистентность чата

```typescript
const STORAGE_KEY = 'ai-chat-messages'

function loadMessages(): Message[] {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) return JSON.parse(stored)
  return [GREETING]  // приветственное сообщение
}

// Сохранение при каждом изменении:
useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
}, [messages])
```

### Приветствие и подсказки

При первом открытии пользователь видит greeting-сообщение и три кнопки-подсказки:
- "Create a push day workout"
- "Start a leg session with squats"
- "What did I do last workout?"

Подсказки исчезают после первого сообщения пользователя.

### Подтверждение деструктивных действий

Когда AI возвращает `requires_confirmation: true`:

```
┌─────────────────────────────────┐
│ ⚠ Confirmation required         │
│ This will delete session (abc..)│
│ [Confirm] [Cancel]              │
└─────────────────────────────────┘
```

При подтверждении вызывается `POST /api/ai/confirm`. После успешного удаления — `onSessionDeleted()` обновляет страницы History/Progress.

### Отображение результатов

- Для `info` действий — показывается только текстовый ответ (без дублирования result)
- Для `create_session` / `delete_session` — показывается статус (успех/ошибка) под сообщением

### Настройки AI

Toggle в хедере сайдбара: Settings → переключатель AI on/off.

---

## 6. Интеграция в App.tsx

```typescript
import AISidebar from '@/features/ai-sidebar/AISidebar'

// В JSX, после </main>:
{page !== 'active-session' && (
  <AISidebar
    onSessionCreated={startSession}
    onSessionDeleted={() => setRefreshKey((k) => k + 1)}
  />
)}
```

- `onSessionCreated` — AI создал сессию → переход в ActiveSession
- `onSessionDeleted` — AI удалил сессию → `refreshKey` инкрементируется → History/Progress перемонтируются и перезагружают данные
- Сайдбар скрыт во время активной тренировки

---

## 7. Дополнение: rest_seconds в ExerciseSet

В этой же фазе добавлено поле **rest_seconds** (время отдыха между сетами):

### Backend модель

```python
class ExerciseSet(SQLModel, table=True):
    # ...
    rest_seconds: int = 0  # новое поле
```

### Миграция БД

```python
# database.py — _run_migrations()
cursor.execute("PRAGMA table_info(exercise_set)")
set_columns = {row[1] for row in cursor.fetchall()}
if "rest_seconds" not in set_columns:
    cursor.execute("ALTER TABLE exercise_set ADD COLUMN rest_seconds INTEGER DEFAULT 0")
```

### API схемы

`rest_seconds` добавлен в `SetIn`, `SetOut`, `LogSetIn` — проходит через весь стек.

### Frontend UI

Active session — 5-колоночная сетка вместо 4:

```
Set | Weight | Reps | Rest | ✓
 1  |  60kg  |  10  | 60s  | ✓
 2  |  60kg  |  10  | 90s  | ✓
```

History — rest отображается в бейджах сетов: `60kg × 10 reps · 60s rest`

---

## 8. Как всё работает вместе (Phase 5)

```
Flow AI чата:

1. Пользователь нажимает floating button → Sheet открывается
   → Greeting + подсказки (если первый визит)

2. Пользователь вводит "Create a push day workout"
   → POST /api/ai/chat (messages=[...])
   → Backend: контекст → LLM → WorkoutAction(action="create_session", ...)
   → Backend: execute_action → создаёт WorkoutSession
   → Response: { response: "Created push day...", action: {...}, result: { success: true, session_id: "..." } }
   → Frontend: показывает ответ + onSessionCreated(session_id)
   → Переход в ActiveSession

3. Пользователь: "Delete my last workout"
   → LLM → WorkoutAction(action="delete_session", requires_confirmation=true, session_id="...")
   → Frontend: показывает confirmation dialog
   → Пользователь нажимает "Confirm"
   → POST /api/ai/confirm { action: "delete_session", session_id: "..." }
   → Backend: удаляет сессию
   → Frontend: onSessionDeleted() → refreshKey++ → History обновляется

4. Пользователь выключает AI
   → PUT /api/ai/settings { ai_enabled: false }
   → Input заблокирован, показывается "AI is disabled"
```

---

# Phase 6: Production Readiness — Деплой в облако

## Содержание Phase 6

1. [Обзор: что нужно для продакшена](#1-обзор-что-нужно-для-продакшена)
2. [Конфигурация и безопасность](#2-конфигурация-и-безопасность)
3. [Multi-stage Dockerfile](#3-multi-stage-dockerfile)
4. [Docker Compose для продакшена](#4-docker-compose-для-продакшена)
5. [Caddy — реверс-прокси с автоматическим HTTPS](#5-caddy--реверс-прокси-с-автоматическим-https)
6. [SPA Fallback — раздача фронтенда из FastAPI](#6-spa-fallback--раздача-фронтенда-из-fastapi)
7. [Интеграционные тесты](#7-интеграционные-тесты)
8. [Oracle Cloud — создание бесплатного сервера](#8-oracle-cloud--создание-бесплатного-сервера)
9. [Деплой на сервер](#9-деплой-на-сервер)
10. [Обновление приложения](#10-обновление-приложения)

---

## 1. Обзор: что нужно для продакшена

В разработке у нас два отдельных процесса:
- Frontend dev server (Vite на `:5173`) → проксирует `/api` на backend
- Backend (Uvicorn на `:8000`) → отдаёт только API

В продакшене всё работает **из одного контейнера**:
- Vite **собирает** фронтенд в статические файлы (`dist/`)
- FastAPI **раздаёт** эти файлы + API из одного процесса
- Caddy стоит перед ним как реверс-прокси и обеспечивает HTTPS

```
Интернет → Caddy (:80/:443) → FastAPI (:8000) → SQLite
                  ↑                    ↑
           автоматический         API + статика
           HTTPS (Let's Encrypt)  (один процесс)
```

---

## 2. Конфигурация и безопасность

### config.py — новые настройки

```python
class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_jwt_secret: str = ""
    openrouter_api_key: str = ""
    database_url: str = "sqlite:///./workout_tracker.db"
    cors_origins: str = "http://localhost:5173"    # НОВОЕ
    environment: str = "development"                # НОВОЕ

    model_config = {"env_file": ("../.env", ".env"), "extra": "ignore"}
```

**Что изменилось:**
- `cors_origins` — раньше было захардкожено `["http://localhost:5173"]` в `main.py`. Теперь берётся из переменной окружения
- `environment` — `development` или `production`, на будущее
- `env_file` — кортеж `("../.env", ".env")`: ищет сначала `../.env` (для локальной разработки из `backend/`), потом `.env` (для Docker)

### main.py — CORS из переменной окружения

```python
settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    # ...
)
```

**Зачем:** в продакшене `CORS_ORIGINS=https://myfitnesspal.online` — браузер не сможет отправлять запросы с другого домена. Это защита от CSRF-подобных атак.

### .env.example — шаблон без секретов

```bash
# Supabase Auth
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret

# AI features (optional)
OPENROUTER_API_KEY=your-openrouter-key

# Database
DATABASE_URL=sqlite:///./data/workout_tracker.db

# CORS
CORS_ORIGINS=http://localhost:5173

# Environment
ENVIRONMENT=development

# Domain for Caddy HTTPS (production only)
DOMAIN=yourdomain.com
```

**Правило безопасности:** `.env` файл с реальными ключами НИКОГДА не попадает в git (прописан в `.gitignore`). В репозитории лежит только `.env.example` как шаблон.

---

## 3. Multi-stage Dockerfile

Это самый важный файл для продакшена. Используем **multi-stage build** — два этапа в одном Dockerfile:

```dockerfile
# === Stage 1: Build frontend ===
FROM node:20-slim AS frontend-build

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# === Stage 2: Production backend + frontend ===
FROM python:3.12-slim

RUN pip install uv

WORKDIR /app

# Install Python dependencies
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev

# Copy backend code
COPY backend/app/ app/

# Copy built frontend into a location the backend can serve
COPY --from=frontend-build /app/dist/ frontend_dist/

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Разбор по шагам

**Stage 1 (`frontend-build`):**
1. `FROM node:20-slim AS frontend-build` — берём Node.js образ, даём ему имя `frontend-build`
2. `ARG VITE_SUPABASE_URL` / `ARG VITE_SUPABASE_ANON_KEY` — build arguments. Vite **вшивает** переменные `VITE_*` в JavaScript бандл во время сборки (не в рантайме!). Без них фронтенд получит `undefined` и покажет чёрный экран
3. `COPY frontend/package.json frontend/package-lock.json ./` → `RUN npm ci` — сначала копируем только package файлы и ставим зависимости. Это **кешируемый слой**: если зависимости не менялись, Docker возьмёт из кеша
4. `COPY frontend/ .` → `RUN npm run build` — копируем исходники и собираем. Результат: `/app/dist/` с `index.html`, `assets/index-*.js`, `assets/index-*.css`

**Stage 2 (финальный образ):**
1. `FROM python:3.12-slim` — **новый** чистый образ, Node.js в нём нет (экономим ~500MB)
2. `COPY --from=frontend-build /app/dist/ frontend_dist/` — копируем **только результат сборки** из Stage 1
3. `RUN mkdir -p /app/data` — директория для SQLite файла

**Результат:** один образ (~300MB) с Python + собранный фронтенд. Node.js не включён.

### .dockerignore

```
**/.git
**/.env
**/.env.*
!**/.env.example
**/node_modules
**/__pycache__
**/dist
**/.vite
*.db
```

**Зачем:** Docker при `COPY` отправляет весь контекст (все файлы) в daemon. `.dockerignore` исключает тяжёлые и ненужные файлы — сборка быстрее и образ чище. Главное: `.env` с секретами **не попадает** в образ.

---

## 4. Docker Compose для продакшена

```yaml
services:
  app:
    build:
      context: .
      args:
        VITE_SUPABASE_URL: ${SUPABASE_URL}
        VITE_SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - DATABASE_URL=sqlite:///./data/workout_tracker.db
      - ENVIRONMENT=production
    volumes:
      - app-data:/app/data
    expose:
      - "8000"

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"
    environment:
      - DOMAIN=${DOMAIN:-localhost}
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy-data:/data
      - caddy-config:/config

volumes:
  app-data:
  caddy-data:
  caddy-config:
```

### Ключевые моменты

**`build.args`:**
```yaml
args:
  VITE_SUPABASE_URL: ${SUPABASE_URL}
  VITE_SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
```
Docker Compose читает `${SUPABASE_URL}` из `.env` файла и передаёт как `ARG` в Dockerfile Stage 1. Так Vite получает значения при `npm run build`.

**`env_file: .env`:**
Все переменные из `.env` передаются в контейнер как переменные окружения (runtime). Это для backend (Supabase JWT, OpenRouter API key).

**`volumes: app-data:/app/data`:**
Docker volume — данные SQLite сохраняются между перезапусками контейнера. Без этого при `docker compose down && up` база данных была бы пустой.

**`expose: "8000"` (не `ports`):**
Порт 8000 доступен **только внутри Docker сети** — Caddy подключается к нему. Снаружи порт 8000 не виден. Весь внешний трафик идёт через Caddy на 80/443.

**`443:443/udp`:**
Для HTTP/3 (QUIC) — Caddy поддерживает его автоматически.

---

## 5. Caddy — реверс-прокси с автоматическим HTTPS

```
{$DOMAIN:localhost} {
    reverse_proxy app:8000
}
```

Всего **3 строки**. Caddy делает:

1. **Автоматический HTTPS** — при первом запуске Caddy видит домен (например, `myfitnesspal.online`), обращается к Let's Encrypt, получает TLS сертификат и настраивает HTTPS. Всё автоматически, без настройки.
2. **Редирект HTTP → HTTPS** — запросы на `:80` автоматически перенаправляются на `:443`
3. **Реверс-прокси** — все запросы передаются на `app:8000` (наш FastAPI контейнер)
4. **HTTP/2 и HTTP/3** — включены по умолчанию

**`{$DOMAIN:localhost}`** — переменная окружения `DOMAIN`. Если не задана, используется `localhost` (для локального тестирования).

**Почему Caddy, а не Nginx?**
- Nginx: нужно вручную настраивать certbot, cron для обновления сертификатов, файлы конфигурации на 30+ строк
- Caddy: 3 строки, HTTPS работает из коробки

---

## 6. SPA Fallback — раздача фронтенда из FastAPI

```python
# main.py

_frontend_dist = Path(__file__).parent.parent / "frontend_dist"
if _frontend_dist.is_dir():
    app.mount("/assets", StaticFiles(directory=str(_frontend_dist / "assets")),
              name="frontend_assets")

    @app.get("/{full_path:path}")
    async def spa_fallback(request: Request, full_path: str):
        """Serve frontend files, fallback to index.html for SPA routing."""
        file_path = _frontend_dist / full_path
        if full_path and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(_frontend_dist / "index.html")
```

### Зачем это нужно?

React — это **Single Page Application**. Весь роутинг происходит на клиенте. Когда пользователь заходит на `https://myfitnesspal.online/history`, сервер должен вернуть `index.html`, а React внутри разберётся какую страницу показать.

**Логика:**
1. `if _frontend_dist.is_dir()` — код активируется только в продакшене (когда `frontend_dist/` существует). В разработке этой папки нет — фронтенд работает через Vite dev server
2. `app.mount("/assets", ...)` — JS/CSS файлы раздаются напрямую как статика (быстро, с кешированием)
3. `spa_fallback` — catch-all маршрут: если файл существует — отдаём его, если нет — отдаём `index.html`

**Порядок маршрутов важен:** API роуты (`/api/*`) регистрируются раньше, поэтому `spa_fallback` их не перехватывает.

---

## 7. Интеграционные тесты

### conftest.py — тестовые фикстуры

```python
import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlalchemy.pool import StaticPool

from app.models.user import User
from app.models.exercise import Exercise
from app.models.session import WorkoutSession, SessionExercise, ExerciseSet
from app.models.routine import Routine, RoutineExercise

from app.main import app
from app.database import get_session
from app.auth.supabase import ensure_user_exists

TEST_USER_ID = "test-user-00000000-0000-0000-0000-000000000001"

@pytest.fixture(name="client")
def client_fixture():
    engine = create_engine(
        "sqlite://",                              # in-memory БД
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,                     # все соединения — одна БД
    )
    SQLModel.metadata.create_all(engine)

    with Session(engine) as setup_session:
        setup_session.add(User(id=TEST_USER_ID))
        setup_session.commit()

    def override_get_session():
        with Session(engine) as session:
            yield session

    def override_ensure_user_exists():
        return TEST_USER_ID

    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[ensure_user_exists] = override_ensure_user_exists

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
```

### Ключевые паттерны

**`sqlite://` (in-memory):**
Каждый тест получает чистую базу данных в памяти. Быстро (нет файловых операций), изолированно (тесты не влияют друг на друга).

**`StaticPool`:**
SQLAlchemy по умолчанию создаёт пул соединений. Для in-memory SQLite это проблема: каждое новое соединение — новая пустая база. `StaticPool` гарантирует, что все `Session(engine)` используют **одно и то же** соединение (и одну базу).

**`dependency_overrides`:**
FastAPI позволяет подменять зависимости для тестов:
- `get_session` → отдаёт сессию к тестовой in-memory БД вместо реальной
- `ensure_user_exists` → возвращает тестовый `user_id` вместо проверки JWT токена

**Импорт всех моделей:**
```python
from app.models.user import User
from app.models.exercise import Exercise
# ...
```
`SQLModel.metadata.create_all(engine)` создаёт таблицы только для моделей, которые уже импортированы в Python. Без явного импорта таблица `user` не будет создана → тесты упадут с "no such table".

### Примеры тестов

**Жизненный цикл сессии (test_sessions.py):**

```python
def test_full_session_lifecycle(client):
    # 1. Создать упражнение
    r = client.post("/api/exercises", json={"name": "Squat", "muscle_group": "legs"})
    exercise_id = r.json()["id"]

    # 2. Начать сессию
    r = client.post("/api/sessions", json={})
    session_id = r.json()["id"]

    # 3. Добавить упражнение
    r = client.post(f"/api/sessions/{session_id}/exercises",
                    json={"exercise_id": exercise_id})
    se_id = r.json()["exercises"][0]["id"]

    # 4. Залогировать подход
    r = client.post(f"/api/sessions/{session_id}/exercises/{se_id}/sets",
                    json={"set_number": 1, "reps": 10, "weight": 80.0, "rest_seconds": 90})
    assert r.json()["exercises"][0]["sets"][0]["reps"] == 10

    # 5. Завершить сессию
    r = client.put(f"/api/sessions/{session_id}/complete")
    assert r.json()["completed_at"] is not None

    # 6. Проверить в списке
    r = client.get("/api/sessions")
    assert len(r.json()) == 1
```

**Прогресс (test_progress.py):**

```python
def test_personal_bests(client):
    r = client.post("/api/exercises", json={"name": "Squat", "muscle_group": "legs"})
    eid = r.json()["id"]

    _create_completed_session(client, eid, 80, 5)   # 80kg × 5
    _create_completed_session(client, eid, 100, 3)   # 100kg × 3

    r = client.get("/api/progress/personal-bests")
    squat_best = next(b for b in r.json() if b["exercise_id"] == eid)
    assert squat_best["weight"] == 100   # личный рекорд — 100kg
```

### Запуск тестов

```bash
cd backend && uv run pytest tests/ -v
```

Результат: 14 тестов, ~0.7 секунды:
- 4 теста на упражнения (CRUD)
- 4 теста на сессии (жизненный цикл)
- 6 тестов на прогресс (summary, personal bests, trends, weekly)

---

## 8. Oracle Cloud — создание бесплатного сервера

Oracle Cloud Free Tier предоставляет **бессрочно бесплатный** ARM сервер:
- До 4 CPU (Ampere A1) и 24 GB RAM
- 200 GB блочного хранилища
- 10 TB трафика в месяц

### Шаги

1. **Регистрация** на [cloud.oracle.com](https://cloud.oracle.com) → "Start for Free"
   - Нужна банковская карта для верификации (списаний не будет)
   - Выбрать ближайший регион (нельзя изменить позже)

2. **Создание VCN** (Virtual Cloud Network):
   - Networking → Virtual Cloud Networks → Start VCN Wizard
   - "Create VCN with Internet Connectivity" — создаёт VCN с public subnet и internet gateway

3. **Создание VM**:
   - Compute → Instances → Create Instance
   - Image: Ubuntu 24.04
   - Shape: VM.Standard.A1.Flex (ARM), 1-2 OCPU, 6-12 GB RAM
   - Networking: выбрать созданный VCN и **public subnet**
   - Отметить "Automatically assign public IPv4 address"
   - Скачать SSH ключ

4. **Открыть порты** (два уровня файрвола):
   - Oracle Security List: добавить Ingress Rules для TCP 80 и 443
   - OS firewall (после SSH):
     ```bash
     sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
     sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
     sudo netfilter-persistent save
     ```

5. **Установить Docker**:
   ```bash
   curl -fsSL https://get.docker.com | sudo sh
   sudo usermod -aG docker $USER
   # перелогиниться
   ```

---

## 9. Деплой на сервер

### DNS

На регистраторе домена (Namecheap, Porkbun и т.д.) создать A-записи:

| Type | Host | Value |
|------|------|-------|
| A Record | @ | IP сервера |
| A Record | www | IP сервера |

### Деплой

```bash
ssh -i your-key ubuntu@YOUR_IP

# Клонировать репозиторий
git clone https://github.com/your-user/workout-tracker.git
cd workout-tracker

# Создать .env с реальными секретами
nano .env
```

Содержимое `.env`:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
OPENROUTER_API_KEY=your-openrouter-key
DATABASE_URL=sqlite:///./data/workout_tracker.db
CORS_ORIGINS=https://yourdomain.com
ENVIRONMENT=production
DOMAIN=yourdomain.com
```

```bash
# Собрать и запустить
docker compose up --build -d

# Проверить логи
docker compose logs -f
```

### Supabase — обновить redirect URLs

В Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://yourdomain.com`
- Redirect URLs: `https://yourdomain.com/**`

---

## 10. Обновление приложения

После push в git:

```bash
ssh -i your-key ubuntu@YOUR_IP
cd workout-tracker
git pull
docker compose up --build -d
```

Docker пересоберёт только изменившиеся слои (кеширование!). Caddy продолжает работать — downtime минимальный.

---

## Итоговая архитектура безопасности

| Угроза | Защита |
|--------|--------|
| Перехват трафика | Caddy + Let's Encrypt (HTTPS автоматически) |
| Утечка секретов | `.env` только на сервере, `.gitignore` исключает из git |
| CSRF / кросс-доменные запросы | CORS ограничен доменом через `CORS_ORIGINS` |
| Неавторизованный доступ к API | Supabase JWT проверяется на каждом запросе |
| Доступ к серверу | Только SSH по ключу, порты 80/443 открыты |
| Потеря данных | SQLite на Docker volume (переживает перезапуск контейнера) |

---

```
Структура файлов Phase 6:

workout-tracker/
├── Dockerfile              # Multi-stage: build frontend + backend image
├── .dockerignore           # Исключения для Docker build context
├── docker-compose.yml      # Production: app + Caddy
├── docker-compose.dev.yml  # Development: hot reload
├── Caddyfile               # Реверс-прокси + автоматический HTTPS
├── .env.example            # Шаблон переменных окружения
├── .gitignore              # .env исключён, .env.example — нет
├── backend/
│   ├── app/
│   │   ├── config.py       # + cors_origins, environment
│   │   └── main.py         # + CORS из env, SPA fallback
│   └── tests/
│       ├── conftest.py     # Фикстуры: in-memory SQLite, mock auth
│       ├── test_exercises.py
│       ├── test_sessions.py
│       └── test_progress.py
└── frontend/
    └── .env.example        # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

---

# Phase 7: Auth UX + Локализация

## Обзор

В этой фазе реализованы три улучшения UX и поддержка двух языков (RU/EN).

---

## 1. Подтверждение регистрации

**Проблема:** После нажатия Sign Up пользователь ничего не видел и не знал, что нужно подтвердить email.

**Решение:** После успешного `supabase.auth.signUp()` приложение переходит на экран-заглушку "Проверьте почту":

```tsx
// frontend/src/pages/Login.tsx
if (isSignUp) {
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) {
    setError(error.message)
  } else {
    setSignUpSuccess(true)  // показываем экран подтверждения
  }
}

// Экран подтверждения
if (signUpSuccess) {
  return (
    <div>
      <Mail />
      <h1>Проверьте почту</h1>
      <p>Мы отправили ссылку на {email}. Нажмите на неё для активации.</p>
      <Button onClick={() => setSignUpSuccess(false)}>Назад</Button>
    </div>
  )
}
```

---

## 2. Восстановление пароля

**Архитектура:**

```
Пользователь → "Забыли пароль?" → вводит email
→ supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' })
→ Supabase отправляет письмо со ссылкой
→ Пользователь кликает → переходит на /reset-password#access_token=...&type=recovery
→ Supabase автоматически логинит пользователя + вызывает PASSWORD_RECOVERY событие
→ Приложение показывает форму нового пароля
→ supabase.auth.updateUser({ password }) → пароль обновлён
```

**Обнаружение события восстановления (`useAuth.ts`):**

```ts
// Инициализация: проверяем URL hash при загрузке страницы
const [isPasswordRecovery, setIsPasswordRecovery] = useState(
  window.location.hash.includes('type=recovery')
)

// Слушаем события Supabase
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY') {
    setIsPasswordRecovery(true)
  }
  // Supabase может выстрелить SIGNED_IN вместо PASSWORD_RECOVERY
  if (event === 'SIGNED_IN' && window.location.hash.includes('type=recovery')) {
    setIsPasswordRecovery(true)
  }
  setSession(session)
  setUser(session?.user ?? null)
})
```

**Показ формы нового пароля (`App.tsx`):**

```tsx
if (isPasswordRecovery && user) {
  return (
    <ResetPassword
      onDone={() => {
        clearPasswordRecovery()
        window.history.replaceState(null, '', '/')
      }}
    />
  )
}
```

**Настройка Supabase (обязательно!):**
- Dashboard → Authentication → URL Configuration
- Redirect URLs: добавить `https://myfitnesspal.online/reset-password`
- Site URL: `https://myfitnesspal.online`

---

## 3. Очистка истории AI-чата

Кнопка с иконкой корзины в шапке AI-сайдбара:

```tsx
// frontend/src/features/ai-sidebar/AISidebar.tsx
const handleClearChat = () => {
  setMessages([makeGreeting(t)])   // сброс к приветствию
  localStorage.removeItem(STORAGE_KEY)
}

// В шапке сайдбара:
<button onClick={handleClearChat} title={t('ai.clearHistory')}>
  <Trash2 className="h-4 w-4" />
</button>
```

---

## 4. Локализация (RU/EN)

### Архитектура

**Файл переводов:** `frontend/src/lib/i18n.tsx`

```tsx
// Словарь ~130 строк
const translations: Record<string, { en: string; ru: string }> = {
  'nav.home':         { en: 'Home',      ru: 'Главная' },
  'login.signIn':     { en: 'Sign In',   ru: 'Войти' },
  'session.addSet':   { en: 'Add Set',   ru: 'Добавить подход' },
  // ...
}

// Контекст
export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('app-language') || 'en')

  const t = (key: string) => translations[key]?.[lang] ?? key

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}

export function useTranslation() {
  return useContext(I18nContext)
}
```

**Подключение в `main.tsx`:**

```tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>
)
```

**Использование в компонентах:**

```tsx
const { t, lang, setLang } = useTranslation()

// Текст
<h1>{t('progress.title')}</h1>

// Placeholder
<Input placeholder={t('exercises.searchPlaceholder')} />

// Локаль для дат
const locale = lang === 'ru' ? 'ru-RU' : undefined
date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
```

**Переключатель языка:**

```tsx
// В шапке (App.tsx) — для залогиненных пользователей
<button onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}>
  {lang === 'en' ? 'RU' : 'EN'}
</button>

// На странице логина — фиксированная позиция top-right
const langToggle = (
  <button
    onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}
    className="fixed top-4 right-4 ..."
  >
    {lang === 'en' ? 'RU' : 'EN'}
  </button>
)
```

### Приветствие AI на правильном языке

Приветствие хранится в localStorage с фиксированным `id: 'greeting'`. При рендере используем `t()` вместо сохранённого текста:

```tsx
// Всегда отображаем в текущем языке
{msg.id === 'greeting' ? t('ai.greeting') : msg.content}
```

### Файловая структура

```
frontend/src/
├── lib/
│   └── i18n.tsx          # I18nProvider, useTranslation, словарь
├── pages/
│   ├── Login.tsx          # + langToggle, все строки через t()
│   ├── ResetPassword.tsx  # Новая страница смены пароля
│   └── ...                # Все страницы переведены
├── hooks/
│   └── useAuth.ts         # + isPasswordRecovery, clearPasswordRecovery
└── features/
    └── ai-sidebar/
        └── AISidebar.tsx  # + кнопка очистки, строки через t()
```

---

## Деплой Phase 7

```bash
# Локально
git add -A
git commit -m "Phase 7: auth UX improvements and RU/EN localization"
git push

# На сервере
ssh -i "C:/Users/LENOVO/Downloads/ssh-key-2026-03-29.key" ubuntu@92.5.0.166
cd ~/workout-tracker
git pull
docker compose up --build -d
```
