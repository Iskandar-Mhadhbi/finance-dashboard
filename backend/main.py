from fastapi import FastAPI
from app.core.config import settings
from app.routers import auth
from app.routers import auth, stocks
from app.routers import auth, stocks, watchlist
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="Finance Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(stocks.router, prefix="/api")
app.include_router(watchlist.router, prefix="/api")


@app.get("/")
def read_root():
    return {"message": "Finance Dashboard API is running", "env": settings.app_env}