CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  mode INTEGER NOT NULL,
  wins INTEGER NOT NULL,
  losses INTEGER NOT NULL,
  draws INTEGER NOT NULL,
  heroine_id TEXT,
  heroine_name TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS runs_board ON runs (mode, wins DESC, draws DESC, created_at);
