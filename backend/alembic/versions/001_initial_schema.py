"""Initial schema migration: creates cloud_resources and incident_logs tables.

Revision ID: 001
Revises: None
Create Date: 2026-10-15
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create cloud_resources table
    op.create_table(
        "cloud_resources",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("resource_type", sa.String(length=50), nullable=False),
        sa.Column("cloud_provider", sa.String(length=30), nullable=False),
        sa.Column("region", sa.String(length=30), nullable=False),
        sa.Column("status", sa.String(length=20), server_default="running", nullable=False),
        sa.Column("cost_per_month", sa.Float(), server_default="0", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint("cost_per_month >= 0", name="check_positive_cost"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_cloud_resources_name"), "cloud_resources", ["name"], unique=False)

    # 2. Create incident_logs table
    op.create_table(
        "incident_logs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("resource_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=150), nullable=False),
        sa.Column("severity", sa.String(length=20), server_default="medium", nullable=False),
        sa.Column("status", sa.String(length=20), server_default="open", nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["resource_id"],
            ["cloud_resources.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_incident_logs_resource_id"), "incident_logs", ["resource_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_incident_logs_resource_id"), table_name="incident_logs")
    op.drop_table("incident_logs")
    op.drop_index(op.f("ix_cloud_resources_name"), table_name="cloud_resources")
    op.drop_table("cloud_resources")
