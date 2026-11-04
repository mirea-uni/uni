from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.db import check_database

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> JSONResponse:
    try:
        db_ok = check_database()
    except Exception:
        db_ok = False
    if db_ok:
        return JSONResponse(status_code=200, content={"status": "ok", "database": "ok"})
    return JSONResponse(
        status_code=503, content={"status": "unavailable", "database": "unavailable"}
    )
