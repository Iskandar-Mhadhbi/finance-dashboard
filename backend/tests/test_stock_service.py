import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException
from app.services.stock_service import get_stock_quote, get_stock_history


@pytest.mark.asyncio
async def test_get_stock_quote_success():
    mock_info = {
        "currentPrice": 150.0,
        "previousClose": 148.0,
        "shortName": "Apple Inc.",
        "currency": "USD",
    }

    with patch("app.services.stock_service.yf.Ticker") as mock_ticker:
        mock_ticker.return_value.info = mock_info
        quote = await get_stock_quote("AAPL")

    assert quote.symbol == "AAPL"
    assert quote.price == 150.0
    assert quote.change == 2.0
    assert quote.currency == "USD"


@pytest.mark.asyncio
async def test_get_stock_quote_invalid_symbol():
    with patch("app.services.stock_service.yf.Ticker") as mock_ticker:
        mock_ticker.return_value.info = {}
        with pytest.raises(HTTPException) as exc:
            await get_stock_quote("INVALIDXYZ")

    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_get_stock_history_success():
    import pandas as pd 

    dates = pd.date_range("2024-01-01", periods=3)
    mock_hist = pd.DataFrame({"Close": [100.0, 101.0, 102.0]}, index=dates)

    with patch("app.services.stock_service.yf.Ticker") as mock_ticker:
        mock_ticker.return_value.history = MagicMock(return_value=mock_hist)
        history = await get_stock_history("AAPL", "1mo")

    assert history.symbol == "AAPL"
    assert len(history.points) == 3
    assert history.points[0].close == 100.0


@pytest.mark.asyncio
async def test_get_stock_history_empty():
    import pandas as pd

    with patch("app.services.stock_service.yf.Ticker") as mock_ticker:
        mock_ticker.return_value.history = MagicMock(return_value=pd.DataFrame())
        with pytest.raises(HTTPException) as exc:
            await get_stock_history("INVALIDXYZ", "1mo")

    assert exc.value.status_code == 404