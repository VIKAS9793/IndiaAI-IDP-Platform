"""add_raw_data_to_ocr_results

Revision ID: aaa264578cd1
Revises: 8a9f15cba5a1
Create Date: 2025-11-30 10:12:17.625373

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'aaa264578cd1'
down_revision: Union[str, None] = '8a9f15cba5a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add raw_data column to ocr_results table for storing bounding boxes and OCR metadata
    op.add_column('ocr_results', sa.Column('raw_data', sa.Text(), nullable=True))


def downgrade() -> None:
    # Remove raw_data column
    op.drop_column('ocr_results', 'raw_data')
