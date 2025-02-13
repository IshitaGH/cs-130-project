"""Added expense_period data tables

Revision ID: ce6050036851
Revises: 909fe4f32d46
Create Date: 2025-02-10 23:25:32.611154

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ce6050036851'
down_revision = '909fe4f32d46'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('expense_periods',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('room_fkey', sa.Integer(), nullable=True),
    sa.Column('start_date', sa.DateTime(), nullable=False),
    sa.Column('end_date', sa.DateTime(), nullable=True),
    sa.Column('open', sa.Boolean(), nullable=False),
    sa.ForeignKeyConstraint(['room_fkey'], ['rooms.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('expense_periods')
    # ### end Alembic commands ###
