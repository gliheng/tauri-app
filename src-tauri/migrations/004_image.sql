-- Create image table
CREATE TABLE IF NOT EXISTS image (
  id TEXT PRIMARY KEY,
  fileId INTEGER NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  params TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (fileId) REFERENCES file_store(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_image_updated_at ON image(updatedAt);
CREATE INDEX IF NOT EXISTS idx_image_provider ON image(provider);
