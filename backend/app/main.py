from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api import auth, users, reports, stats, admin, payments, subscriptions

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(title="WorldRun API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://wr.idigeneri.ru", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(reports.router)
app.include_router(stats.router)
app.include_router(admin.router)
app.include_router(payments.router)
app.include_router(subscriptions.router)

@app.get("/health")
async def health():
    return {"status": "ok"}
