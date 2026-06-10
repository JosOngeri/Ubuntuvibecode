-- Migration: Create orientation checklist tables
-- Description: Creates tables for orientation checklist templates and progress tracking
-- Date: 2024-06-02

CREATE TABLE IF NOT EXISTS orientation_checklist_templates (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  items JSONB NOT NULL, -- Array of {id, title, description, required, order}
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orientation_checklist_progress (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT REFERENCES employees(id) ON DELETE CASCADE,
  template_id BIGINT REFERENCES orientation_checklist_templates(id),
  completed_items JSONB DEFAULT '[]', -- Array of completed item IDs
  notes JSONB DEFAULT '{}', -- {itemId: note}
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(employee_id)
);

-- Seed default orientation checklist
INSERT INTO orientation_checklist_templates (name, items, is_default) VALUES
('Standard Onboarding', '[
  {"id": 1, "title": "Company Policy Review", "description": "Review employee handbook", "required": true, "order": 1},
  {"id": 2, "title": "IT Setup", "description": "Computer and email setup", "required": true, "order": 2},
  {"id": 3, "title": "Security Training", "description": "Complete security awareness training", "required": true, "order": 3},
  {"id": 4, "title": "Benefits Enrollment", "description": "Enroll in benefits program", "required": true, "order": 4},
  {"id": 5, "title": "Team Introduction", "description": "Meet with team members", "required": false, "order": 5},
  {"id": 6, "title": "Workspace Tour", "description": "Tour of office/facilities", "required": false, "order": 6}
]', true)
ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE orientation_checklist_templates IS 'Templates for orientation checklists';
COMMENT ON COLUMN orientation_checklist_templates.items IS 'JSON array of checklist items with structure: {id, title, description, required, order}';
COMMENT ON COLUMN orientation_checklist_templates.is_default IS 'Whether this is the default template for new hires';
COMMENT ON TABLE orientation_checklist_progress IS 'Tracks orientation checklist progress per employee';
COMMENT ON COLUMN orientation_checklist_progress.completed_items IS 'JSON array of completed item IDs';
COMMENT ON COLUMN orientation_checklist_progress.notes IS 'JSON object mapping item IDs to notes';
