from fastapi import FastAPI
from app.core.config import settings
from app.routers.api import router
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="Finance Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def read_root():
    return {"message": "Finance Dashboard API is running", "env": settings.app_env}