import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve(process.env.DATABASE_PATH || './data/payouts.db');
const command = process.argv[2];

function getDb(): Database.Database {
  if (!fs.existsSync(dbPath)) {
    console.log('No database found.');
    process.exit(1);
  }
  return new Database(dbPath);
}

function printHelp() {
  console.log(`
Discord Payouts Bot - CLI Management

Usage: npm run cli <command>

Commands:
  reset           Delete the entire database (fresh start)
  stats           Show database stats (total payouts, users, etc.)
  list [user_id]  List active payouts (optionally filter by user)
  purge-expired   Permanently delete payouts older than 30 days
  clear-user <id> Remove all payouts for a specific user
  help            Show this help message
`);
}

switch (command) {
  case 'reset': {
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      // Clean up WAL files if they exist
      if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal');
      if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm');
      console.log('Database deleted. It will be recreated on next bot start.');
    } else {
      console.log('No database found. Nothing to reset.');
    }
    break;
  }

  case 'stats': {
    const db = getDb();
    const total = db.prepare(`SELECT COUNT(*) as count FROM payouts WHERE removed = 0`).get() as { count: number };
    const removed = db.prepare(`SELECT COUNT(*) as count FROM payouts WHERE removed = 1`).get() as { count: number };
    const users = db.prepare(`SELECT COUNT(DISTINCT user_id) as count FROM payouts WHERE removed = 0`).get() as { count: number };
    const active30 = db.prepare(`
      SELECT COUNT(*) as count FROM payouts
      WHERE removed = 0 AND created_at >= datetime('now', '-30 days')
    `).get() as { count: number };
    const totalAmount = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payouts
      WHERE removed = 0 AND created_at >= datetime('now', '-30 days')
    `).get() as { total: number };

    console.log(`
Database: ${dbPath}
Active payouts (all time):  ${total.count}
Active payouts (30 days):   ${active30.count}
Removed payouts:            ${removed.count}
Unique users:               ${users.count}
Total amount (30 days):     $${totalAmount.total.toFixed(2)}
`);
    db.close();
    break;
  }

  case 'list': {
    const db = getDb();
    const userId = process.argv[3];
    let rows;
    if (userId) {
      rows = db.prepare(`
        SELECT id, user_id, amount, created_at, removed FROM payouts
        WHERE user_id = ? ORDER BY created_at DESC
      `).all(userId);
    } else {
      rows = db.prepare(`
        SELECT id, user_id, amount, created_at, removed FROM payouts
        WHERE removed = 0 AND created_at >= datetime('now', '-30 days')
        ORDER BY created_at DESC
      `).all();
    }

    if ((rows as any[]).length === 0) {
      console.log('No payouts found.');
    } else {
      console.log(`\nID\tUser\t\t\tAmount\t\tDate\t\t\tRemoved`);
      console.log('-'.repeat(90));
      for (const row of rows as any[]) {
        console.log(`${row.id}\t${row.user_id}\t$${row.amount.toFixed(2)}\t\t${row.created_at}\t${row.removed ? 'Yes' : 'No'}`);
      }
      console.log(`\n${(rows as any[]).length} payout(s) found.`);
    }
    db.close();
    break;
  }

  case 'purge-expired': {
    const db = getDb();
    const result = db.prepare(`
      DELETE FROM payouts WHERE created_at < datetime('now', '-30 days')
    `).run();
    console.log(`Permanently deleted ${result.changes} expired payout(s).`);
    db.close();
    break;
  }

  case 'clear-user': {
    const userId = process.argv[3];
    if (!userId) {
      console.log('Usage: npm run cli clear-user <user_id>');
      process.exit(1);
    }
    const db = getDb();
    const result = db.prepare(`
      UPDATE payouts SET removed = 1 WHERE user_id = ? AND removed = 0
    `).run(userId);
    console.log(`Removed ${result.changes} payout(s) for user ${userId}.`);
    db.close();
    break;
  }

  case 'help':
  default:
    printHelp();
    break;
}
