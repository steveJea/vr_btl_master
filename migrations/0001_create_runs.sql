CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  mode INTEGER NOT NULL,
  wins INTEGER NOT NULL,
  loses INTEGER NOT NULL,
  draws INTEGER NOT NULL,
  margin INTEGER NOT NULL,
  heroine_id TEXT NOT NULL,
  heroine_name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_runs_board ON runs (mode, wins DESC, margin DESC, created_at ASC);
