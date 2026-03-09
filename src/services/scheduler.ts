import cron from 'node-cron';
import { Client } from 'discord.js';
import { config } from '../config';
import { runBackup } from '../database/backup';
import { triggerRankingRecalculation } from './ranking';
import { announceRolloffs } from './rolloffAnnouncements';

export function startScheduler(client: Client): void {
  cron.schedule(config.rankingCron, async () => {
    console.log('[Scheduler] Running ranking recalculation...');
    try {
      const guild = await client.guilds.fetch(config.guildId);
      await guild.members.fetch();
      await guild.roles.fetch();
      await triggerRankingRecalculation(guild);
      console.log('[Scheduler] Ranking recalculation complete.');
      await announceRolloffs(client);
    } catch (error) {
      console.error('[Scheduler] Ranking recalculation failed:', error);
    }
  });

  cron.schedule(config.backupCron, async () => {
    console.log('[Scheduler] Running daily database backup...');
    try {
      await runBackup();
      console.log('[Scheduler] Database backup complete.');
    } catch (error) {
      console.error('[Scheduler] Database backup failed:', error);
    }
  });

  console.log(`[Scheduler] Ranking recalculation scheduled: ${config.rankingCron}`);
  console.log(`[Scheduler] Daily database backup scheduled: ${config.backupCron}`);
}
