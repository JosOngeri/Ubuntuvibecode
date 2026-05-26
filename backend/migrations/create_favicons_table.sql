-- Create favicons table
CREATE TABLE IF NOT EXISTS favicons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('default', 'custom') NOT NULL DEFAULT 'default',
  filename VARCHAR(255),
  original_name VARCHAR(255),
  path VARCHAR(500),
  mime_type VARCHAR(100),
  size INT,
  is_active BOOLEAN DEFAULT FALSE,
  uploaded_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create index on is_active for faster lookups
CREATE INDEX idx_favicons_is_active ON favicons(is_active);

-- Create index on type for filtering
CREATE INDEX idx_favicons_type ON favicons(type);
