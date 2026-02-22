import 'dotenv/config';
import { BotConfig } from './types';

function parseNumEnv(name: string, defaultVal: number): number {
  const val = process.env[name];
  if (val == null || val === '') return defaultVal;
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : defaultVal;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const positionRoleIds: string[] = [];
for (let i = 1; i <= 12; i++) {
  positionRoleIds.push(requireEnv(`ROLE_POSITION_${i}`));
}

export const config: BotConfig = Object.freeze({
  token: requireEnv('DISCORD_TOKEN'),
  clientId: requireEnv('CLIENT_ID'),
  guildId: requireEnv('GUILD_ID'),
  payoutChannelId: requireEnv('PAYOUT_CHANNEL_ID'),
  positionRoleIds,
  databasePath: process.env.DATABASE_PATH || './data/payouts.db',
  rankingCron: process.env.RANKING_CRON || '0 0 * * *',
  backupCron: process.env.BACKUP_CRON || '0 1 * * *',
  backupRetentionDays: process.env.BACKUP_RETENTION_DAYS
    ? parseInt(process.env.BACKUP_RETENTION_DAYS, 10)
    : 0,
  timeoutChanceDiff1: parseNumEnv('TIMEOUT_CHANCE_DIFF_1', 25),
  timeoutChanceDiff3: parseNumEnv('TIMEOUT_CHANCE_DIFF_3', 10),
  timeoutChanceDiff5: parseNumEnv('TIMEOUT_CHANCE_DIFF_5', 5),
  timeoutChanceDiff10: parseNumEnv('TIMEOUT_CHANCE_DIFF_10', 1),
  timeoutChanceDiff12: parseNumEnv('TIMEOUT_CHANCE_DIFF_12', 0.1),
  timeoutUnrankedRank: parseNumEnv('TIMEOUT_UNRANKED_RANK', 13),
});
