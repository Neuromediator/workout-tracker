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
