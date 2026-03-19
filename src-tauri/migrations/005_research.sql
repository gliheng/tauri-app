-- Create research topic table
CREATE TABLE IF NOT EXISTS research_topic (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  icon TEXT NOT NULL,
  agentId TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (agentId) REFERENCES agent(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_research_topic_updated_at ON research_topic(updatedAt);
CREATE INDEX IF NOT EXISTS idx_research_topic_agent_id ON research_topic(agentId);

-- Create research resource table
CREATE TABLE IF NOT EXISTS research_resource (
  id TEXT PRIMARY KEY,
  topicId TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('text', 'url')),
  title TEXT NOT NULL,
  source TEXT,
  content TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending', 'ingesting', 'ready', 'error')),
  error TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (topicId) REFERENCES research_topic(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_research_resource_topic_id ON research_resource(topicId);
CREATE INDEX IF NOT EXISTS idx_research_resource_status ON research_resource(status);
CREATE INDEX IF NOT EXISTS idx_research_resource_updated_at ON research_resource(updatedAt);
