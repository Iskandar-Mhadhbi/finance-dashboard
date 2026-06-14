from fastapi import FastAPI
from app.core.config import settings
from app.routers import auth

app = FastAPI(title="Finance Dashboard API")

app.include_router(auth.router, prefix="/api")


@app.get("/")
def read_root():
    return {"message": "Finance Dashboard API is running", "env": settings.app_env}