import db from './connection';

const insertStmt = db.prepare(`
  INSERT INTO timeouts (user_id, guild_id, duration_ms, executor_id, backfire)
  VALUES (?, ?, ?, ?, ?)
`);

const getUserStatsStmt = db.prepare(`
  SELECT COUNT(*) AS count, COALESCE(SUM(duration_ms), 0) AS total_duration_ms
  FROM timeouts
  WHERE user_id = ? AND guild_id = ?
    AND created_at >= datetime('now', '-30 days')
`);

const getTopTimedOutStmt = db.prepare(`
  SELECT user_id, SUM(duration_ms) AS total_duration_ms, COUNT(*) AS count
  FROM timeouts
  WHERE guild_id = ? AND created_at >= datetime('now', '-30 days')
  GROUP BY user_id
  ORDER BY total_duration_ms DESC, MIN(created_at) ASC
  LIMIT ?
`);

/** Insert a timeout event. Returns the new row's id. */
export function insertTimeout(
  userId: string,
  guildId: string,
  durationMs: number,
  executorId: string | null,
  backfire: number
): number {
  const result = insertStmt.run(userId, guildId, durationMs, executorId, backfire);
  return Number(result.lastInsertRowid);
}

/** Get a user's timeout stats in the last 30 days. */
export function getUserTimeoutStats(userId: string, guildId: string): { count: number; totalDurationMs: number } {
  const row = getUserStatsStmt.get(userId, guildId) as { count: number; total_duration_ms: number };
  return {
    count: row.count,
    totalDurationMs: row.total_duration_ms,
  };
}

/** Get the top N users by total time timed out (30-day rolling). */
export function getTopTimedOutUsers(
  guildId: string,
  limit: number = 10
): Array<{ user_id: string; total_duration_ms: number; count: number }> {
  return getTopTimedOutStmt.all(guildId, limit) as Array<{
    user_id: string;
    total_duration_ms: number;
    count: number;
  }>;
}
