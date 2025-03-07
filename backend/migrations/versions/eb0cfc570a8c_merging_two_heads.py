"""merging two heads

Revision ID: eb0cfc570a8c
Revises: 5246e7e4cb55, ffb4c21d9d23
Create Date: 2025-03-07 00:20:06.414649

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'eb0cfc570a8c'
down_revision = ('5246e7e4cb55', 'ffb4c21d9d23')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
