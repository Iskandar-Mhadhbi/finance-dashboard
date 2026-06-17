"""pgvector metadata jsonb

Revision ID: 6296bdb69a39
Revises: ff4a3492c91a
Create Date: 2026-06-17 19:08:28.935091

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '6296bdb69a39'
down_revision: Union[str, Sequence[str], None] = 'ff4a3492c91a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        'langchain_pg_collection',
        'cmetadata',
        type_=postgresql.JSONB(astext_type=sa.Text()),
        existing_type=postgresql.JSON(astext_type=sa.Text()),
        postgresql_using='cmetadata::jsonb',
    )
    op.alter_column(
        'langchain_pg_embedding',
        'cmetadata',
        type_=postgresql.JSONB(astext_type=sa.Text()),
        existing_type=postgresql.JSON(astext_type=sa.Text()),
        postgresql_using='cmetadata::jsonb',
    )


def downgrade() -> None:
    op.alter_column(
        'langchain_pg_collection',
        'cmetadata',
        type_=postgresql.JSON(astext_type=sa.Text()),
        existing_type=postgresql.JSONB(astext_type=sa.Text()),
        postgresql_using='cmetadata::json',
    )
    op.alter_column(
        'langchain_pg_embedding',
        'cmetadata',
        type_=postgresql.JSON(astext_type=sa.Text()),
        existing_type=postgresql.JSONB(astext_type=sa.Text()),
        postgresql_using='cmetadata::json',
    )