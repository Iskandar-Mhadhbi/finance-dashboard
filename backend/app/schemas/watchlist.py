from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class AddWatchlistItem(BaseModel):
    symbol: str
    notes: str = ""


class WatchlistItemResponse(BaseModel):
    id: UUID
    symbol: str
    notes: str
    created_at: datetime

    model_config = {"from_attributes": True}