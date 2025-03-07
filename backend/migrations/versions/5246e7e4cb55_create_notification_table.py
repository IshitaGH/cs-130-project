"""Create notification table

Revision ID: 5246e7e4cb55
Revises: e3c906c4907f
Create Date: 2025-03-04 08:31:46.840488

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5246e7e4cb55'
down_revision = 'e3c906c4907f'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('notifications',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(), nullable=True),
    sa.Column('description', sa.String(), nullable=True),
    sa.Column('notification_time', sa.DateTime(), nullable=False),
    sa.Column('notification_sender', sa.Integer(), nullable=True),
    sa.Column('notification_recipient', sa.Integer(), nullable=True),
    sa.Column('room_fkey', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['notification_recipient'], ['roommates.id'], ),
    sa.ForeignKeyConstraint(['notification_sender'], ['roommates.id'], ),
    sa.ForeignKeyConstraint(['room_fkey'], ['rooms.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('notifications')
    # ### end Alembic commands ###
