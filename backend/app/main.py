from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api import auth, users, reports, stats, admin, payments, subscriptions, achievements, admin_auth, challenges, cms
from app.database import async_session
from app.services.achievements import seed_achievements
from app.services.seed import seed_admin, seed_default_content

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with async_session() as db:
        await seed_achievements(db)
        await seed_admin(db)
        await seed_default_content(db)
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
app.include_router(admin_auth.router)
app.include_router(payments.router)
app.include_router(subscriptions.router)
app.include_router(achievements.router)
app.include_router(challenges.router)
app.include_router(cms.router)

@app.get("/health")
async def health():
    return {"status": "ok"}
