"""Add Étudiant level

Revision ID: c1b7bde773e1
Revises: 6a0a78f411cb
Create Date: 2026-04-01 15:42:35.620397

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1b7bde773e1'
down_revision: Union[str, Sequence[str], None] = '6a0a78f411cb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
