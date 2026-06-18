import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException
from app.services.auth_service import register_user, login_user
from app.schemas.auth import RegisterRequest, LoginRequest


@pytest.fixture
def mock_db():
    db = AsyncMock()
    db.scalar = AsyncMock(return_value=None)
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    return db


@pytest.mark.asyncio
async def test_register_user_success(mock_db):
    data = RegisterRequest(email="test@example.com", password="password123", name="Test User")

    with patch("app.services.auth_service.hash_password", return_value="hashed"):
        with patch("app.services.auth_service.create_access_token", return_value="token123"):
            token = await register_user(mock_db, data)

    assert token == "token123"
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_register_user_duplicate_email(mock_db):
    mock_db.scalar = AsyncMock(return_value=MagicMock())  # existing user
    data = RegisterRequest(email="taken@example.com", password="password123", name="Test")

    with pytest.raises(HTTPException) as exc:
        await register_user(mock_db, data)

    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_login_user_success(mock_db):
    mock_user = MagicMock()
    mock_user.id = "some-uuid"
    mock_user.email = "test@example.com"
    mock_db.scalar = AsyncMock(return_value=mock_user)

    data = LoginRequest(email="test@example.com", password="password123")

    with patch("app.services.auth_service.verify_password", return_value=True):
        with patch("app.services.auth_service.create_access_token", return_value="token123"):
            token = await login_user(mock_db, data)

    assert token == "token123"


@pytest.mark.asyncio
async def test_login_user_wrong_password(mock_db):
    mock_user = MagicMock()
    mock_db.scalar = AsyncMock(return_value=mock_user)

    data = LoginRequest(email="test@example.com", password="wrongpassword")

    with patch("app.services.auth_service.verify_password", return_value=False):
        with pytest.raises(HTTPException) as exc:
            await login_user(mock_db, data)

    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_login_user_not_found(mock_db):
    mock_db.scalar = AsyncMock(return_value=None)
    data = LoginRequest(email="nobody@example.com", password="password123")

    with pytest.raises(HTTPException) as exc:
        await login_user(mock_db, data)

    assert exc.value.status_code == 401