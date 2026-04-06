from database import Base, engine
from sqlalchemy import text
import models 

print("🗑️ Nuking old database schema (ignoring dependencies)...")
with engine.connect() as conn:
    # This forces PostgreSQL to drop ALL tables and recreate a clean environment
    conn.execute(text("DROP SCHEMA public CASCADE;"))
    conn.execute(text("CREATE SCHEMA public;"))
    conn.commit()

print("🏗️ Creating brand new tables with perfect UUIDs...")
Base.metadata.create_all(bind=engine)

print("✅ Database reset complete!")