import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.watchlist import WatchlistItem
from app.schemas.watchlist import AddWatchlistItem


async def get_watchlist(db: AsyncSession, user_id: uuid.UUID) -> list[WatchlistItem]:
    result = await db.scalars(
        select(WatchlistItem)
        .where(WatchlistItem.user_id == user_id)
        .order_by(WatchlistItem.created_at.desc())
    )
    return list(result.all())


async def add_to_watchlist(
    db: AsyncSession, user_id: uuid.UUID, data: AddWatchlistItem
) -> WatchlistItem:
    existing = await db.scalar(
        select(WatchlistItem).where(
            WatchlistItem.user_id == user_id,
            WatchlistItem.symbol == data.symbol.upper(),
        )
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{data.symbol.upper()} is already in your watchlist",
        )

    item = WatchlistItem(
        user_id=user_id,
        symbol=data.symbol.upper(),
        notes=data.notes,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


async def remove_from_watchlist(
    db: AsyncSession, user_id: uuid.UUID, item_id: uuid.UUID
) -> None:
    item = await db.scalar(
        select(WatchlistItem).where(
            WatchlistItem.id == item_id, WatchlistItem.user_id == user_id
        )
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Watchlist item not found",
        )

    await db.delete(item)
    await db.commit()