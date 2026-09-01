"""initial_schema

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-08-29 23:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('role', sa.Enum('broker', 'manager', 'admin', name='user_role_enum'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # Customers table
    op.create_table(
        'customers',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('external_ref', sa.String(length=64), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('kyc_status', sa.Enum('verified', 'pending', 'rejected', name='kyc_status_enum'), nullable=False),
        sa.Column('kyc_channel', sa.String(length=50), nullable=True),
        sa.Column('kyc_review_note', sa.Text(), nullable=True),
        sa.Column('assigned_broker_id', sa.String(length=36), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['assigned_broker_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_customers_assigned_broker_id'), 'customers', ['assigned_broker_id'], unique=False)
    op.create_index(op.f('ix_customers_external_ref'), 'customers', ['external_ref'], unique=True)

    # Customer Financial Snapshots table
    op.create_table(
        'customer_financial_snapshots',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('customer_id', sa.String(length=36), nullable=False),
        sa.Column('products', postgresql.ARRAY(sa.String()), nullable=False),
        sa.Column('loan_status', sa.Text(), nullable=True),
        sa.Column('policies', postgresql.ARRAY(sa.String()), nullable=False),
        sa.Column('transaction_summary', sa.Text(), nullable=True),
        sa.Column('crm_last_contact', sa.Date(), nullable=True),
        sa.Column('crm_contact_note', sa.Text(), nullable=True),
        sa.Column('as_of', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_customer_financial_snapshots_customer_id'), 'customer_financial_snapshots', ['customer_id'], unique=True)

    # Priority Scores table
    op.create_table(
        'priority_scores',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('customer_id', sa.String(length=36), nullable=False),
        sa.Column('score', sa.Float(), nullable=False),
        sa.Column('score_display', sa.Integer(), nullable=False),
        sa.Column('priority_level', sa.Enum('high', 'medium', 'low', name='priority_level_enum'), nullable=False),
        sa.Column('shap_values', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('feature_importance', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('scored_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('model_version', sa.String(length=50), nullable=False),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_priority_scores_customer_id'), 'priority_scores', ['customer_id'], unique=False)
    op.create_index(op.f('ix_priority_scores_scored_at'), 'priority_scores', ['scored_at'], unique=False)

    # AI Insights table
    op.create_table(
        'ai_insights',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('customer_id', sa.String(length=36), nullable=False),
        sa.Column('score_id', sa.String(length=36), nullable=True),
        sa.Column('insight_text', sa.Text(), nullable=False),
        sa.Column('discussion_topics', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('model', sa.String(length=100), nullable=False),
        sa.Column('prompt_version', sa.String(length=50), nullable=False),
        sa.Column('generated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('reviewed_by', sa.String(length=36), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['score_id'], ['priority_scores.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_insights_customer_id'), 'ai_insights', ['customer_id'], unique=False)
    op.create_index(op.f('ix_ai_insights_generated_at'), 'ai_insights', ['generated_at'], unique=False)

    # Follow-ups table
    op.create_table(
        'follow_ups',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('customer_id', sa.String(length=36), nullable=False),
        sa.Column('broker_id', sa.String(length=36), nullable=False),
        sa.Column('renewal_date', sa.Date(), nullable=True),
        sa.Column('last_contact_date', sa.Date(), nullable=True),
        sa.Column('payment_status', sa.Enum('paid', 'overdue', 'pending', name='payment_status_enum'), nullable=False),
        sa.Column('follow_up_window', sa.String(length=100), nullable=True),
        sa.Column('engagement_status', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('open', 'done', 'snoozed', name='followup_status_enum'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['broker_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_follow_ups_broker_id'), 'follow_ups', ['broker_id'], unique=False)
    op.create_index(op.f('ix_follow_ups_customer_id'), 'follow_ups', ['customer_id'], unique=True)
    op.create_index(op.f('ix_follow_ups_renewal_date'), 'follow_ups', ['renewal_date'], unique=False)

    # Audit logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=True),
        sa.Column('entity_id', sa.String(length=36), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_logs_action'), 'audit_logs', ['action'], unique=False)
    op.create_index(op.f('ix_audit_logs_timestamp'), 'audit_logs', ['timestamp'], unique=False)
    op.create_index(op.f('ix_audit_logs_user_id'), 'audit_logs', ['user_id'], unique=False)

    # Conversation history table
    op.create_table(
        'conversation_history',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('session_id', sa.String(length=36), nullable=False),
        sa.Column('customer_id', sa.String(length=36), nullable=True),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('role', sa.Enum('user', 'assistant', name='conv_role_enum'), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_conversation_history_created_at'), 'conversation_history', ['created_at'], unique=False)
    op.create_index(op.f('ix_conversation_history_customer_id'), 'conversation_history', ['customer_id'], unique=False)
    op.create_index(op.f('ix_conversation_history_session_id'), 'conversation_history', ['session_id'], unique=False)
    op.create_index(op.f('ix_conversation_history_user_id'), 'conversation_history', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_table('conversation_history')
    op.drop_table('audit_logs')
    op.drop_table('follow_ups')
    op.drop_table('ai_insights')
    op.drop_table('priority_scores')
    op.drop_table('customer_financial_snapshots')
    op.drop_table('customers')
    op.drop_table('users')
