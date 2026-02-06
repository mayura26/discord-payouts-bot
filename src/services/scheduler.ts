import cron from 'node-cron';
import { Client } from 'discord.js';
import { config } from '../config';
import { triggerRankingRecalculation } from './ranking';

export function startScheduler(client: Client): void {
  cron.schedule(config.rankingCron, async () => {
    console.log('[Scheduler] Running daily ranking recalculation...');
    try {
      const guild = await client.guilds.fetch(config.guildId);
      await guild.members.fetch();
      await guild.roles.fetch();
      await triggerRankingRecalculation(guild);
      console.log('[Scheduler] Ranking recalculation complete.');
    } catch (error) {
      console.error('[Scheduler] Ranking recalculation failed:', error);
    }
  });

  console.log(`[Scheduler] Daily ranking recalculation scheduled: ${config.rankingCron}`);
}
