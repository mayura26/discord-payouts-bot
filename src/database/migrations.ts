import Database from 'better-sqlite3';

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS payouts (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     TEXT    NOT NULL,
      guild_id    TEXT    NOT NULL,
      amount      REAL    NOT NULL CHECK(amount > 0),
      proof_url   TEXT    NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      removed     INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_payouts_user_guild
      ON payouts(user_id, guild_id, removed, created_at);

    CREATE INDEX IF NOT EXISTS idx_payouts_created
      ON payouts(created_at, removed);
  `);
}
