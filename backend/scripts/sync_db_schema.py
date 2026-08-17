"""
Standalone Database Schema Synchronization Script for Foundry.
Safely checks and adds any missing columns (e.g. ai_evaluation_status, pitch_deck_parsed_text)
to PostgreSQL tables using SQLAlchemy reflection and idempotent DDL.
"""

import sys
import os
import logging
from sqlalchemy import inspect, text

# Add backend root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database import engine

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("foundry.db.sync")


COLUMNS_TO_ENSURE = {
    "startups": [
        ("ai_evaluation_status", "VARCHAR DEFAULT 'pending'"),
        ("pitch_deck_parsed_text", "TEXT"),
        ("market_radar_data", "JSON"),
        ("has_pending_update", "BOOLEAN DEFAULT FALSE"),
        ("pending_data", "JSON"),
        ("approval_status", "VARCHAR DEFAULT 'pending'"),
        ("ask_amount", "DOUBLE PRECISION"),
        ("equity_offered", "DOUBLE PRECISION"),
        ("implied_valuation", "DOUBLE PRECISION"),
        ("use_of_funds", "VARCHAR"),
        ("mrr", "DOUBLE PRECISION"),
        ("growth_rate_pct", "DOUBLE PRECISION"),
        ("burn_rate", "DOUBLE PRECISION"),
        ("runway_months", "INTEGER"),
        ("gross_margin_pct", "DOUBLE PRECISION"),
        ("total_raised", "DOUBLE PRECISION"),
        ("main_competitors", "VARCHAR"),
        ("moat_description", "TEXT"),
        ("ai_score", "INTEGER"),
        ("ai_verdict", "VARCHAR"),
        ("ai_score_breakdown", "JSON"),
        ("pitch_deck_url", "VARCHAR"),
    ],
    "users": [
        ("domain_investment_counts", "JSON DEFAULT '{}'::json"),
        ("top_focus_domain", "VARCHAR"),
        ("total_deals_count", "INTEGER DEFAULT 0"),
        ("bio", "VARCHAR"),
        ("linkedin_url", "VARCHAR"),
        ("is_approved", "BOOLEAN DEFAULT FALSE"),
        ("approved_at", "TIMESTAMP WITH TIME ZONE"),
        ("focus_domains", "VARCHAR[] DEFAULT '{}'"),
        ("preferred_stage", "VARCHAR"),
    ]
}


def sync_database_schema():
    logger.info("🔍 Inspecting PostgreSQL database schema...")
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()

    with engine.begin() as conn:
        # 1. Ensure kafka_outbox table exists
        conn.execute(
            text("""
            CREATE TABLE IF NOT EXISTS kafka_outbox (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                topic VARCHAR NOT NULL,
                payload JSON NOT NULL,
                status VARCHAR NOT NULL DEFAULT 'PENDING',
                retry_count INTEGER NOT NULL DEFAULT 0,
                last_error TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS ix_kafka_outbox_topic ON kafka_outbox (topic);
            CREATE INDEX IF NOT EXISTS ix_kafka_outbox_status ON kafka_outbox (status);
            """)
        )
        logger.info("✅ Verified 'kafka_outbox' table and indexes exist.")

        # 2. Ensure columns exist on tables
        for table_name, columns in COLUMNS_TO_ENSURE.items():
            if table_name not in existing_tables:
                logger.warning(f"⚠️ Table '{table_name}' does not exist yet. Skipping column sync.")
                continue

            existing_cols = {col["name"] for col in inspector.get_columns(table_name)}
            logger.info(f"📊 Table '{table_name}' currently has {len(existing_cols)} columns.")

            for col_name, col_type in columns:
                if col_name not in existing_cols:
                    logger.info(f"➕ Adding missing column '{col_name}' ({col_type}) to table '{table_name}'...")
                    conn.execute(
                        text(f"ALTER TABLE {table_name} ADD COLUMN IF NOT EXISTS {col_name} {col_type};")
                    )
                    logger.info(f"✅ Successfully added '{col_name}' to '{table_name}'.")
                else:
                    logger.debug(f"✓ Column '{table_name}.{col_name}' already exists.")

    logger.info("🎉 Database schema synchronization completed successfully.")


if __name__ == "__main__":
    sync_database_schema()
