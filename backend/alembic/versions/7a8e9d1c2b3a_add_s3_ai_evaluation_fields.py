"""add_s3_ai_evaluation_fields

Revision ID: 7a8e9d1c2b3a
Revises: df11c76f9f9d
Create Date: 2026-08-11 08:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7a8e9d1c2b3a'
down_revision: Union[str, Sequence[str], None] = 'df11c76f9f9d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema to include ai_evaluation_status and pitch_deck_parsed_text."""
    op.add_column('startups', sa.Column('ai_evaluation_status', sa.String(), nullable=True, server_default='pending'))
    op.add_column('startups', sa.Column('pitch_deck_parsed_text', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('startups', 'pitch_deck_parsed_text')
    op.drop_column('startups', 'ai_evaluation_status')
