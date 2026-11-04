from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(tags=["health"])


async def check_database() -> bool:
    # TODO(UNI-13): replace with a real DB ping once SQLAlchemy is wired up.
    return True


@router.get("/health")
async def health() -> JSONResponse:
    try:
        db_ok = await check_database()
    except Exception:
        db_ok = False
    if db_ok:
        return JSONResponse(status_code=200, content={"status": "ok", "database": "ok"})
    return JSONResponse(
        status_code=503, content={"status": "unavailable", "database": "unavailable"}
    )
