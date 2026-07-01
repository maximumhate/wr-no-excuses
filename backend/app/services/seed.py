import hashlib
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.admin_user import AdminUser
from app.config import settings

logger = logging.getLogger(__name__)


async def seed_admin(db: AsyncSession):
    result = await db.execute(select(AdminUser).where(AdminUser.username == "worldrunadmin"))
    if result.scalar_one_or_none():
        return
    password_hash = hashlib.sha256("0829149aA!!!!".encode()).hexdigest()
    admin = AdminUser(username="worldrunadmin", password_hash=password_hash)
    db.add(admin)
    await db.commit()
    logger.info("Admin user 'worldrunadmin' seeded")
