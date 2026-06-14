import pandas as pd
import asyncio
import yfinance as yf
from fastapi import HTTPException, status
from app.schemas.stock import StockQuote, StockHistory, StockHistoryPoint


def _fetch_quote(symbol: str) -> StockQuote:
    ticker = yf.Ticker(symbol)
    info = ticker.info

    price = info.get("currentPrice") or info.get("regularMarketPrice")
    previous_close = info.get("previousClose")

    if price is None or previous_close is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stock symbol '{symbol}' not found",
        )

    change = price - previous_close
    change_percent = (change / previous_close) * 100

    return StockQuote(
        symbol=symbol.upper(),
        name=info.get("shortName", symbol.upper()),
        price=round(price, 2),
        previous_close=round(previous_close, 2),
        change=round(change, 2),
        change_percent=round(change_percent, 2),
        currency=info.get("currency", "USD"),
    )


def _fetch_history(symbol: str, period: str) -> StockHistory:
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period=period)

    if hist.empty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No history found for symbol '{symbol}'",
        )

    dates = pd.DatetimeIndex(hist.index).date
    closes = hist["Close"].to_numpy()

    points = [
        StockHistoryPoint(date=str(d), close=round(float(c), 2))
        for d, c in zip(dates, closes)
    ]

    return StockHistory(symbol=symbol.upper(), points=points)


async def get_stock_quote(symbol: str) -> StockQuote:
    return await asyncio.to_thread(_fetch_quote, symbol)


async def get_stock_history(symbol: str, period: str = "1mo") -> StockHistory:
    return await asyncio.to_thread(_fetch_history, symbol, period)