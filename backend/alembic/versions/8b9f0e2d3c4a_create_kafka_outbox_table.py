"""create_kafka_outbox_table

Revision ID: 8b9f0e2d3c4a
Revises: 7a8e9d1c2b3a
Create Date: 2026-08-16 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '8b9f0e2d3c4a'
down_revision: Union[str, Sequence[str], None] = '7a8e9d1c2b3a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create kafka_outbox table idempotently."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    if 'kafka_outbox' not in tables:
        op.create_table(
            'kafka_outbox',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column('topic', sa.String(), nullable=False),
            sa.Column('payload', sa.JSON(), nullable=False),
            sa.Column('status', sa.String(), nullable=False, server_default='PENDING'),
            sa.Column('retry_count', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('last_error', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        )
        op.create_index('ix_kafka_outbox_topic', 'kafka_outbox', ['topic'])
        op.create_index('ix_kafka_outbox_status', 'kafka_outbox', ['status'])


def downgrade() -> None:
    """Drop kafka_outbox table."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    if 'kafka_outbox' in tables:
        op.drop_index('ix_kafka_outbox_status', table_name='kafka_outbox')
        op.drop_index('ix_kafka_outbox_topic', table_name='kafka_outbox')
        op.drop_table('kafka_outbox')
