import Database from 'better-sqlite3';

const db = new Database('follows.db');
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS follows (
  follower_id TEXT NOT NULL,
  target_id   TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  PRIMARY KEY (follower_id, target_id)
);
CREATE TABLE IF NOT EXISTS guild_settings (
  guild_id        TEXT PRIMARY KEY,
  feed_channel_id TEXT,
  mode            TEXT NOT NULL DEFAULT 'dm'
);
`);

export const addFollow = db.prepare(
  'INSERT OR IGNORE INTO follows (follower_id, target_id, created_at) VALUES (?, ?, ?)'
);
export const removeFollow = db.prepare(
  'DELETE FROM follows WHERE follower_id = ? AND target_id = ?'
);
export const listFollows = db.prepare(
  'SELECT target_id, created_at FROM follows WHERE follower_id = ? ORDER BY created_at DESC LIMIT 25'
);
export const followersOf = db.prepare(
  'SELECT follower_id FROM follows WHERE target_id = ?'
);
export const setChannel = db.prepare(`
  INSERT INTO guild_settings (guild_id, feed_channel_id) VALUES (?, ?)
  ON CONFLICT(guild_id) DO UPDATE SET feed_channel_id = excluded.feed_channel_id
`);
export const getSettings = db.prepare(
  'SELECT * FROM guild_settings WHERE guild_id = ?'
);
export default db;
