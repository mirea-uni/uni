# uni

Backend for a co-ownership property platform (FastAPI).

## Requirements

- Python 3.14+
- [uv](https://docs.astral.sh/uv/)

## Setup

```bash
uv sync
cp .env.example .env   # adjust values if needed
```

## Run

```bash
uv run fastapi dev app/main.py
```

- API docs: http://127.0.0.1:8000/docs (Swagger), http://127.0.0.1:8000/redoc
- Health check: `GET /health` → `200 {"status": "ok", "database": "ok"}`, or `503` when the database is unavailable

## Configuration

Settings are read from environment variables or `.env` via pydantic-settings (`app/core/config.py`). See `.env.example`.

## Error format

All errors are returned as JSON without tracebacks or internal details:

```json
{"error": {"code": "http_404", "message": "Not Found"}}
```

Validation errors (`422`) also include `details` with the failing fields.

## Tests

```bash
uv run pytest
```

## Project structure

```
app/
  main.py         # app factory, routers, exception handlers
  api/health.py   # /health endpoint
  core/config.py  # settings
  core/errors.py  # unified error responses
tests/
```
