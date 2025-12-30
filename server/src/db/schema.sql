-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('osix', 'shearn', 'estudio')),
  duration_min INTEGER NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT NOT NULL
);

-- Buildings table
CREATE TABLE IF NOT EXISTS buildings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER REFERENCES sessions(id),
  type TEXT NOT NULL CHECK(type IN ('osix', 'shearn', 'estudio')),
  size TEXT NOT NULL CHECK(size IN ('S', 'M', 'L', 'XL')),
  base_rent REAL NOT NULL,
  layer INTEGER NOT NULL CHECK(layer IN (1, 2, 3)),
  position INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  degraded_at TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'warning', 'abandoned'))
);

-- Game state (singleton)
CREATE TABLE IF NOT EXISTS game_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  total_money REAL DEFAULT 0,
  shearn_multiplier REAL DEFAULT 0.8,
  start_date TEXT,
  last_activity_date TEXT,
  study_last_session TEXT,
  osix_last_session TEXT,
  shearn_last_session TEXT
);

-- Daily log for degradation tracking
CREATE TABLE IF NOT EXISTS daily_log (
  date TEXT PRIMARY KEY,
  minutes_worked INTEGER DEFAULT 0,
  degradation_applied REAL DEFAULT 0
);

-- Initialize game state if not exists
INSERT OR IGNORE INTO game_state (id, total_money, shearn_multiplier, start_date)
VALUES (1, 0, 0.8, datetime('now'));
