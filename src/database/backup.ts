import path from 'path';
import fs from 'fs';
import { config } from '../config';
import db from './connection';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getBackupDir(): string {
  const dbPath = path.resolve(config.databasePath);
  return path.join(path.dirname(dbPath), 'backups');
}

export async function runBackup(): Promise<void> {
  const backupDir = getBackupDir();
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const date = new Date().toISOString().slice(0, 10);
  const dbStem = path.basename(path.resolve(config.databasePath), '.db');
  const backupFileName = `${dbStem}-${date}.db`;
  const backupFilePath = path.join(backupDir, backupFileName);

  await db.backup(backupFilePath);
  console.log(`[Backup] Saved to ${backupFilePath}`);

  if (config.backupRetentionDays > 0) {
    const cutoff = Date.now() - config.backupRetentionDays * 24 * 60 * 60 * 1000;
    const backupFilePattern = new RegExp(`^${escapeRegex(dbStem)}-(\\d{4}-\\d{2}-\\d{2})\\.db$`);
    const files = fs.readdirSync(backupDir);
    let pruned = 0;
    for (const file of files) {
      const match = file.match(backupFilePattern);
      if (!match) continue;
      const filePath = path.join(backupDir, file);
      const stat = fs.statSync(filePath);
      if (stat.mtimeMs < cutoff) {
        fs.unlinkSync(filePath);
        pruned++;
      }
    }
    if (pruned > 0) {
      console.log(`[Backup] Pruned ${pruned} old backup(s).`);
    }
  }
}
