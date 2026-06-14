from pydantic import BaseModel


class StockQuote(BaseModel):
    symbol: str
    name: str
    price: float
    previous_close: float
    change: float
    change_percent: float
    currency: str


class StockHistoryPoint(BaseModel):
    date: str
    close: float


class StockHistory(BaseModel):
    symbol: str
    points: list[StockHistoryPoint]