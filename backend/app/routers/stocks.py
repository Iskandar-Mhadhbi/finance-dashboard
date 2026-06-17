from fastapi import APIRouter, Depends, Query
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.stock import StockQuote, StockHistory
from app.services.stock_service import get_stock_quote, get_stock_history

router = APIRouter(prefix="/api/stocks", tags=["stocks"])


@router.get("/{symbol}/quote", response_model=StockQuote)
async def quote(symbol: str, current_user: User = Depends(get_current_user)):
    return await get_stock_quote(symbol)


@router.get("/{symbol}/history", response_model=StockHistory)
async def history(
    symbol: str,
    period: str = Query("1mo", description="1d, 5d, 1mo, 3mo, 6mo, 1y, 5y, max"),
    current_user: User = Depends(get_current_user),
):
    return await get_stock_history(symbol, period)