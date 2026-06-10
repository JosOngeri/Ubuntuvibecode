-- Migration: Add onboarding table columns
-- Description: Adds columns that were previously auto-added by ensureColumns()
-- Date: 2024-06-02
-- Replaces: Onboarding.model.js ensureColumns()

-- Add orientation checklist column
ALTER TABLE onboarding ADD COLUMN IF NOT EXISTS orientation_checklist JSONB DEFAULT '[]';

-- Add comment for documentation
COMMENT ON COLUMN onboarding.orientation_checklist IS 'JSON array of orientation checklist items and completion status';
