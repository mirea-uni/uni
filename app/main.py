from fastapi import FastAPI

from app.api.health import router as health_router
from app.core.config import settings
from app.core.errors import register_exception_handlers

app = FastAPI(title=settings.app_name, debug=settings.debug)
register_exception_handlers(app)
app.include_router(health_router)
