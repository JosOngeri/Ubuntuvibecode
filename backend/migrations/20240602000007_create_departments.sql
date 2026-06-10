-- Migration: Create departments table
-- Description: Creates departments table for organizational structure
-- Date: 2024-06-02

CREATE TABLE IF NOT EXISTS departments (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  manager_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default departments
INSERT INTO departments (name, description) VALUES
('Engineering', 'Software development and IT'),
('HR', 'Human Resources and People Operations'),
('Finance', 'Finance and Accounting'),
('Operations', 'Operations and Logistics'),
('Sales', 'Sales and Marketing')
ON CONFLICT (name) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE departments IS 'Organizational departments';
COMMENT ON COLUMN departments.manager_id IS 'Employee ID of the department manager';
