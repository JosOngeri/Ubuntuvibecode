-- Migration: Create onboarding documents table
-- Description: Stores uploaded documents during onboarding (contracts, NDAs, etc.)
-- Date: 2024-06-02

CREATE TABLE IF NOT EXISTS onboarding_documents (
  id BIGSERIAL PRIMARY KEY,
  application_id BIGINT REFERENCES job_applications(id) ON DELETE CASCADE,
  employee_id BIGINT REFERENCES employees(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by BIGINT REFERENCES users(id),
  notes TEXT
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_onboarding_documents_application ON onboarding_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_documents_employee ON onboarding_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_documents_type ON onboarding_documents(document_type);

-- Add comments
COMMENT ON TABLE onboarding_documents IS 'Documents uploaded during onboarding process';
COMMENT ON COLUMN onboarding_documents.application_id IS 'Associated job application (if employee not yet created)';
COMMENT ON COLUMN onboarding_documents.employee_id IS 'Associated employee (after creation)';
COMMENT ON COLUMN onboarding_documents.document_type IS 'Type of document: contract, nda, tax_form, id_copy, etc.';
COMMENT ON COLUMN onboarding_documents.document_name IS 'Original filename of the uploaded document';
COMMENT ON COLUMN onboarding_documents.file_url IS 'URL/path to the stored file';
COMMENT ON COLUMN onboarding_documents.file_size IS 'File size in bytes';
COMMENT ON COLUMN onboarding_documents.mime_type IS 'MIME type of the file';
COMMENT ON COLUMN onboarding_documents.uploaded_at IS 'Timestamp when document was uploaded';
COMMENT ON COLUMN onboarding_documents.uploaded_by IS 'User who uploaded the document';
COMMENT ON COLUMN onboarding_documents.notes IS 'Additional notes about the document';
