from pydantic import SecretStr

from app.core.config import Settings


def test_password_not_shown():
    settings = Settings(db_password=SecretStr("s3cret-pw"))
    assert "s3cret-pw" not in str(settings.database_url)
    assert "s3cret-pw" not in repr(settings.database_url)
    assert "s3cret-pw" not in repr(settings)
