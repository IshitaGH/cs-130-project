"""Merge migration heads

Revision ID: 7d0d3826dd60
Revises: 5246e7e4cb55, 9a1c23d80797
Create Date: 2025-03-07 19:32:23.483064

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7d0d3826dd60'
down_revision = ('5246e7e4cb55', '9a1c23d80797')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
