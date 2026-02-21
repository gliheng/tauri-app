-- Create chat table
CREATE TABLE IF NOT EXISTS chat (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  agentId TEXT,
  ext TEXT
);

CREATE INDEX IF NOT EXISTS idx_chat_updated_at ON chat(updatedAt);
CREATE INDEX IF NOT EXISTS idx_chat_agent_id ON chat(agentId);

-- Create message table
CREATE TABLE IF NOT EXISTS message (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chatId TEXT NOT NULL,
  messageId TEXT NOT NULL,
  parent TEXT,
  data TEXT NOT NULL,
  UNIQUE(chatId, messageId)
);

CREATE INDEX IF NOT EXISTS idx_message_chat_id ON message(chatId);

-- Create agent table
CREATE TABLE IF NOT EXISTS agent (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  program TEXT NOT NULL,
  directory TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_updated_at ON agent(updatedAt);

-- Create document table (replaces note and chart tables)
CREATE TABLE IF NOT EXISTS document (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('note', 'chart')),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  content TEXT,        -- used by notes
  data TEXT,           -- used by charts (JSON)
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_document_updated_at ON document(updatedAt);
CREATE INDEX IF NOT EXISTS idx_document_type ON document(type);

-- Create file_store table
CREATE TABLE IF NOT EXISTS file_store (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fileName TEXT NOT NULL,
  fileType TEXT NOT NULL,
  fileData BLOB NOT NULL,
  createdAt TEXT NOT NULL
);
