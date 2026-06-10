-- Migration: Add asset return tracking
-- Description: Tracks asset return process when employees leave
-- Date: 2024-06-02

ALTER TABLE assets
ADD COLUMN IF NOT EXISTS return_status VARCHAR(50) DEFAULT 'not_returned'
CHECK (return_status IN ('not_returned', 'pending_return', 'returned', 'lost', 'damaged'));

ALTER TABLE assets
ADD COLUMN IF NOT EXISTS return_date TIMESTAMPTZ;

ALTER TABLE assets
ADD COLUMN IF NOT EXISTS return_condition VARCHAR(50)
CHECK (return_condition IN ('new', 'good', 'fair', 'poor', 'damaged'));

ALTER TABLE assets
ADD COLUMN IF NOT EXISTS return_notes TEXT;

ALTER TABLE assets
ADD COLUMN IF NOT EXISTS returned_by BIGINT REFERENCES users(id);

-- Add comments
COMMENT ON COLUMN assets.return_status IS 'Status of asset return: not_returned, pending_return, returned, lost, damaged';
COMMENT ON COLUMN assets.return_date IS 'Date when asset was returned';
COMMENT ON COLUMN assets.return_condition IS 'Condition of asset when returned: new, good, fair, poor, damaged';
COMMENT ON COLUMN assets.return_notes IS 'Notes about the asset return process';
COMMENT ON COLUMN assets.returned_by IS 'User who processed the asset return';
