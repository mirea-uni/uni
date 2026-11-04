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

GitHub Actions runs the `Tests` check on pushes to `main`, pull requests, and merge queue
updates using the Python version from `.python-version` and dependencies from
`uv.lock`. A failing test fails the workflow.

Each pull request update triggers one CI run. Open **Details** on the `Tests`
check, then the workflow **Summary** to see the report with individual test
results and failure details. The report is published even when tests fail, as
long as pytest produces its XML report. It uses the Actions summary rather than
creating an additional check, so the PR keeps a single `Tests` check and reporting
also works for pull requests from forks.

To block merging when tests fail, a repository administrator must configure GitHub
once (the workflow file alone does not enforce merge protection):

1. Push this workflow and let it run once so that `Tests` becomes selectable.
2. Open **Settings → Rules → Rulesets → New branch ruleset**.
3. Set enforcement to **Active**, target `main`, and leave the bypass list empty.
4. Enable **Require a pull request before merging** and **Require status checks
   to pass**. Add the `Tests` check with GitHub Actions as its source.
5. Enable **Require branches to be up to date before merging** and save the rule.

Future build or deployment jobs in this workflow should declare `needs: tests`
so that they only run after tests pass.

## Project structure

```
app/
  main.py         # app factory, routers, exception handlers
  api/health.py   # /health endpoint
  core/config.py  # settings
  core/errors.py  # unified error responses
tests/
```
