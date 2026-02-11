import 'dotenv/config';
import { BotConfig } from './types';

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
});
