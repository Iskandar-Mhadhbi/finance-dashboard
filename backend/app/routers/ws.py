from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.models.watchlist import WatchlistItem
from app.services.stock_service import get_stock_quote
import asyncio 

router = APIRouter()


async def get_user_from_token(token: str, db: AsyncSession) -> User | None:
    """Authenticate WebSocket connection via JWT query param."""
    payload = decode_access_token(token)
    if payload is None:
        return None
    user_id = payload.get("sub")
    return await db.scalar(select(User).where(User.id == user_id))


@router.websocket("/ws/prices")
async def websocket_prices(
    websocket: WebSocket,
    token: str = Query(...),
):
    # Get DB session manually (can't use Depends in WebSocket)
    async for db in get_db():
        user = await get_user_from_token(token, db)

        if user is None:
            await websocket.close(code=4001)
            return

        await websocket.accept()

        try:
            while True:
                # Fetch user's watchlist
                result = await db.scalars(
                    select(WatchlistItem).where(WatchlistItem.user_id == user.id)
                )
                items = list(result.all())

                if not items:
                    await websocket.send_json({"prices": {}})
                else:
                    # Fetch all quotes concurrently
                    quotes = {}
                    async def fetch(symbol: str):
                        try:
                            quote = await get_stock_quote(symbol)
                            quotes[symbol] = {
                                "price": quote.price,
                                "change": quote.change,
                                "change_percent": quote.change_percent,
                            }
                        except Exception:
                            pass

                    await asyncio.gather(*[fetch(item.symbol) for item in items])
                    await websocket.send_json({"prices": quotes})

                # Wait 30 seconds before next update
                await asyncio.sleep(30)

        except WebSocketDisconnect:
            pass