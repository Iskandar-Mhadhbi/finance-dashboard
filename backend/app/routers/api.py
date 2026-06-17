from fastapi import APIRouter
from app.routers import auth, stocks, watchlist, rag 


router = APIRouter()

router.include_router(auth.router)
router.include_router(stocks.router)
router.include_router(watchlist.router)
router.include_router(rag.router)