"""Initial migration - User table

Revision ID: 001_initial
Revises: 
Create Date: 2024-01-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Crear tipo enum para roles
    user_role = sa.Enum('ADMIN', 'ANALYST', 'VIEWER', name='userrole')
    user_role.create(op.get_bind(), checkfirst=True)
    
    # Crear tabla users
    op.create_table(
        'users',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('username', sa.String(50), unique=True, nullable=False, index=True),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(100), nullable=True),
        sa.Column('avatar_url', sa.String(500), nullable=True),
        sa.Column('role', user_role, nullable=False, server_default='VIEWER'),
        sa.Column('custom_permissions', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('last_login', sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('users')
    
    # Eliminar tipo enum
    user_role = sa.Enum('ADMIN', 'ANALYST', 'VIEWER', name='userrole')
    user_role.drop(op.get_bind(), checkfirst=True)
