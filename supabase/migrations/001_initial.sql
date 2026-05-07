-- ============================================================
-- TutorialOS — Initial Database Migration
-- 001_initial.sql
-- ============================================================

-- ── Trigger function: auto-update updated_at ─────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Table: sessions ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title          TEXT NOT NULL DEFAULT 'Untitled Session',
  source         TEXT NOT NULL DEFAULT '',
  source_type    TEXT NOT NULL DEFAULT 'unknown'
                   CHECK (source_type IN ('youtube', 'stream', 'iframe', 'unknown')),
  notes_markdown TEXT NOT NULL DEFAULT '',
  notes_rich_json JSONB,
  tags           TEXT[] NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at      TIMESTAMPTZ,
  is_deleted     BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_sessions_user_updated
  ON sessions (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_user_deleted
  ON sessions (user_id, is_deleted);

-- ── Table: timestamps ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS timestamps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  time_seconds  INTEGER NOT NULL CHECK (time_seconds >= 0),
  label         TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timestamps_session
  ON timestamps (session_id, time_seconds);

-- ── Table: doubts ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doubts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id         UUID REFERENCES sessions(id) ON DELETE SET NULL,
  text               TEXT NOT NULL,
  timestamp_seconds  INTEGER CHECK (timestamp_seconds >= 0),
  status             TEXT NOT NULL DEFAULT 'open'
                       CHECK (status IN ('open', 'resolved')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_doubts_user_status
  ON doubts (user_id, status);

-- ── Table: command_snippets ──────────────────────────────────
CREATE TABLE IF NOT EXISTS command_snippets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id  UUID REFERENCES sessions(id) ON DELETE SET NULL,
  command     TEXT NOT NULL,
  language    TEXT NOT NULL DEFAULT 'bash',
  topic       TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commands_user
  ON command_snippets (user_id, created_at DESC);

-- ── Table: review_items ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS review_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id    UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'due'
                  CHECK (status IN ('due', 'done')),
  due_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  ease_factor   NUMERIC(4, 2) NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 1,
  repetitions   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_review_user_status_due
  ON review_items (user_id, status, due_date ASC);

-- ── Table: user_settings ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
  user_id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme              TEXT NOT NULL DEFAULT 'dark'
                       CHECK (theme IN ('dark', 'light', 'system')),
  accent             TEXT NOT NULL DEFAULT 'violet'
                       CHECK (accent IN ('violet', 'cyan', 'emerald', 'rose', 'amber')),
  font_size          TEXT NOT NULL DEFAULT 'md'
                       CHECK (font_size IN ('sm', 'md', 'lg')),
  auto_save          BOOLEAN NOT NULL DEFAULT TRUE,
  cloud_sync_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  editor_mode        TEXT NOT NULL DEFAULT 'write'
                       CHECK (editor_mode IN ('write', 'preview', 'split', 'rich')),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE timestamps       ENABLE ROW LEVEL SECURITY;
ALTER TABLE doubts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings    ENABLE ROW LEVEL SECURITY;

-- sessions policies
CREATE POLICY "sessions_select_own" ON sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sessions_insert_own" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sessions_update_own" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "sessions_delete_own" ON sessions
  FOR DELETE USING (auth.uid() = user_id);

-- timestamps policies
CREATE POLICY "timestamps_select_own" ON timestamps
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "timestamps_insert_own" ON timestamps
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "timestamps_update_own" ON timestamps
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "timestamps_delete_own" ON timestamps
  FOR DELETE USING (auth.uid() = user_id);

-- doubts policies
CREATE POLICY "doubts_select_own" ON doubts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "doubts_insert_own" ON doubts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "doubts_update_own" ON doubts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "doubts_delete_own" ON doubts
  FOR DELETE USING (auth.uid() = user_id);

-- command_snippets policies
CREATE POLICY "commands_select_own" ON command_snippets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "commands_insert_own" ON command_snippets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "commands_update_own" ON command_snippets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "commands_delete_own" ON command_snippets
  FOR DELETE USING (auth.uid() = user_id);

-- review_items policies
CREATE POLICY "review_select_own" ON review_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "review_insert_own" ON review_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "review_update_own" ON review_items
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "review_delete_own" ON review_items
  FOR DELETE USING (auth.uid() = user_id);

-- user_settings policies
CREATE POLICY "settings_select_own" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "settings_insert_own" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "settings_update_own" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "settings_delete_own" ON user_settings
  FOR DELETE USING (auth.uid() = user_id);
