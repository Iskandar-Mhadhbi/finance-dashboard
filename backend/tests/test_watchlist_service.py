import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException
from app.services.watchlist_service import get_watchlist, add_to_watchlist, remove_from_watchlist
from app.schemas.watchlist import AddWatchlistItem


@pytest.fixture
def mock_db():
    db = AsyncMock()
    db.scalar = AsyncMock(return_value=None)
    db.scalars = AsyncMock()
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    db.delete = AsyncMock()
    return db


@pytest.fixture
def user_id():
    return uuid.uuid4()


@pytest.mark.asyncio
async def test_get_watchlist_empty(mock_db, user_id):
    mock_db.scalars.return_value.all = MagicMock(return_value=[])
    result = await get_watchlist(mock_db, user_id)
    assert result == []


@pytest.mark.asyncio
async def test_get_watchlist_returns_items(mock_db, user_id):
    mock_item = MagicMock()
    mock_db.scalars.return_value.all = MagicMock(return_value=[mock_item])
    result = await get_watchlist(mock_db, user_id)
    assert len(result) == 1


@pytest.mark.asyncio
async def test_add_to_watchlist_success(mock_db, user_id):
    mock_db.scalar = AsyncMock(return_value=None)
    data = AddWatchlistItem(symbol="AAPL")

    mock_fast_info = MagicMock()
    mock_fast_info.last_price = 150.0

    with patch("yfinance.Ticker") as mock_ticker:
        mock_ticker.return_value.fast_info = mock_fast_info
        await add_to_watchlist(mock_db, user_id, data)

    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_add_to_watchlist_duplicate(mock_db, user_id):
    mock_db.scalar = AsyncMock(return_value=MagicMock())  # already exists
    data = AddWatchlistItem(symbol="AAPL")

    with pytest.raises(HTTPException) as exc:
        await add_to_watchlist(mock_db, user_id, data)

    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_add_to_watchlist_invalid_symbol(mock_db, user_id):
    mock_db.scalar = AsyncMock(return_value=None)
    data = AddWatchlistItem(symbol="INVALIDXYZ")

    mock_fast_info = MagicMock()
    mock_fast_info.last_price = None

    with patch("yfinance.Ticker") as mock_ticker:
        mock_ticker.return_value.fast_info = mock_fast_info
        with pytest.raises(HTTPException) as exc:
            await add_to_watchlist(mock_db, user_id, data)

    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_remove_from_watchlist_success(mock_db, user_id):
    mock_item = MagicMock()
    mock_db.scalar = AsyncMock(return_value=mock_item)
    item_id = uuid.uuid4()

    await remove_from_watchlist(mock_db, user_id, item_id)

    mock_db.delete.assert_called_once_with(mock_item)
    mock_db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_remove_from_watchlist_not_found(mock_db, user_id):
    mock_db.scalar = AsyncMock(return_value=None)
    item_id = uuid.uuid4()

    with pytest.raises(HTTPException) as exc:
        await remove_from_watchlist(mock_db, user_id, item_id)

    assert exc.value.status_code == 404