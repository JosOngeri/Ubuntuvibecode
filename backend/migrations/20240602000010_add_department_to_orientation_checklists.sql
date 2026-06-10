-- Migration: Add department to orientation checklist templates
-- Description: Makes orientation checklists customizable per department
-- Date: 2024-06-02

ALTER TABLE orientation_checklist_templates
ADD COLUMN IF NOT EXISTS department_id BIGINT REFERENCES departments(id) ON DELETE SET NULL;

-- Update the default template to be department-agnostic (NULL department_id)
UPDATE orientation_checklist_templates
SET department_id = NULL
WHERE is_default = true;

-- Add unique constraint so each department can have at most one template
CREATE UNIQUE INDEX IF NOT EXISTS unique_department_template
ON orientation_checklist_templates(department_id)
WHERE department_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN orientation_checklist_templates.department_id IS 'Department this template applies to. NULL means it applies to all departments (default template)';
