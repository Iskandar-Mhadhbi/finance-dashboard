from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.services.rag_service import fetch_and_store_news, answer_question
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/rag", tags=["rag"])


class QuestionRequest(BaseModel):
    question: str


@router.post("/{symbol}/fetch")
async def fetch_news(symbol: str, current_user: User = Depends(get_current_user)):
    """Fetch and embed latest news for a stock symbol."""
    count = await fetch_and_store_news(symbol.upper())
    if count == 0:
        raise HTTPException(status_code=404, detail=f"No news found for {symbol.upper()}")
    return {"symbol": symbol.upper(), "articles_indexed": count}


@router.post("/{symbol}/ask")
async def ask_question(
    symbol: str,
    body: QuestionRequest,
    current_user: User = Depends(get_current_user),
):
    """Answer a question about a stock based on recent news."""
    answer = await answer_question(symbol.upper(), body.question)
    return {"symbol": symbol.upper(), "question": body.question, "answer": answer}