-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,                    -- Composite key: type::key
    type TEXT NOT NULL,                     -- 'model', 'agent', 'chat', 'websearch'
    key TEXT NOT NULL,                      -- Provider name or 'default'
    value TEXT NOT NULL,                    -- JSON stringified value
    UNIQUE(type, key)
);

CREATE INDEX IF NOT EXISTS idx_settings_type ON settings(type);
