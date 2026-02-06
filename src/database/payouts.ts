import db from './connection';
import { PayoutRow, RankedUser } from '../types';

const insertStmt = db.prepare(`
  INSERT INTO payouts (user_id, guild_id, amount, proof_url)
  VALUES (?, ?, ?, ?)
`);

const removeStmt = db.prepare(`
  UPDATE payouts SET removed = 1
  WHERE id = ? AND removed = 0
`);

const removeOwnStmt = db.prepare(`
  UPDATE payouts SET removed = 1
  WHERE id = ? AND user_id = ? AND removed = 0
`);

const getByIdStmt = db.prepare(`
  SELECT * FROM payouts WHERE id = ?
`);

const getUserPayoutsStmt = db.prepare(`
  SELECT * FROM payouts
  WHERE user_id = ? AND guild_id = ? AND removed = 0
    AND created_at >= datetime('now', '-30 days')
  ORDER BY created_at DESC
`);

const getUserTotalStmt = db.prepare(`
  SELECT COALESCE(SUM(amount), 0) AS total
  FROM payouts
  WHERE user_id = ? AND guild_id = ? AND removed = 0
    AND created_at >= datetime('now', '-30 days')
`);

const getTopUsersStmt = db.prepare(`
  SELECT user_id, SUM(amount) AS total_amount
  FROM payouts
  WHERE guild_id = ? AND removed = 0
    AND created_at >= datetime('now', '-30 days')
  GROUP BY user_id
  ORDER BY total_amount DESC, MIN(created_at) ASC
  LIMIT ?
`);

/** Insert a new payout. Returns the new row's id. */
export function insertPayout(userId: string, guildId: string, amount: number, proofUrl: string): number {
  const result = insertStmt.run(userId, guildId, amount, proofUrl);
  return Number(result.lastInsertRowid);
}

/** Soft-delete a payout by id. Returns true if a row was updated. */
export function removePayout(payoutId: number): boolean {
  const result = removeStmt.run(payoutId);
  return result.changes > 0;
}

/** Soft-delete a payout, but only if it belongs to the given user. Returns true if updated. */
export function removeOwnPayout(payoutId: number, userId: string): boolean {
  const result = removeOwnStmt.run(payoutId, userId);
  return result.changes > 0;
}

/** Get a single payout by id. */
export function getPayoutById(payoutId: number): PayoutRow | undefined {
  return getByIdStmt.get(payoutId) as PayoutRow | undefined;
}

/** Get a user's active payouts in the last 30 days. */
export function getUserPayouts(userId: string, guildId: string): PayoutRow[] {
  return getUserPayoutsStmt.all(userId, guildId) as PayoutRow[];
}

/** Get a user's 30-day rolling total. */
export function getUserTotal(userId: string, guildId: string): number {
  const row = getUserTotalStmt.get(userId, guildId) as { total: number };
  return row.total;
}

/** Get the top N users by 30-day total. */
export function getTopUsers(guildId: string, limit: number = 10): RankedUser[] {
  return getTopUsersStmt.all(guildId, limit) as RankedUser[];
}
