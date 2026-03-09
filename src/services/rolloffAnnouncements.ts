import { Client, EmbedBuilder } from 'discord.js';
import { config } from '../config';
import {
  getRolledOffUnannounced,
  getUserTotal,
  getTopUsers,
  markRolloffAnnounced,
} from '../database/payouts';
import { formatCurrency } from '../utils/formatters';

/**
 * Find payouts that have rolled off the 30-day window and not yet been announced,
 * post an announcement to the payout channel for each (payout + new total and rank),
 * and mark them as announced.
 */
export async function announceRolloffs(client: Client): Promise<void> {
  try {
    const guild = await client.guilds.fetch(config.guildId).catch(() => null);
    if (!guild) {
      console.warn('[RolloffAnnouncements] Guild not found.');
      return;
    }

    const channel = await guild.channels.fetch(config.payoutChannelId).catch(() => null);
    if (!channel || !channel.isSendable()) {
      console.warn('[RolloffAnnouncements] Payout channel not found or not sendable.');
      return;
    }

    const payouts = getRolledOffUnannounced(guild.id);
    if (payouts.length === 0) {
      return;
    }

    let announced = 0;
    const topUsers = getTopUsers(guild.id, 12);

    for (const payout of payouts) {
      try {
        const newTotal = getUserTotal(payout.user_id, payout.guild_id);
        const rankIndex = topUsers.findIndex(u => u.user_id === payout.user_id);
        const rank = rankIndex >= 0 ? rankIndex + 1 : null;
        const rankText = rank ? `**#${rank}**` : '**unranked**';

        const description =
          `Payout #${payout.id} (${formatCurrency(payout.amount)}) has rolled off the 30-day window. ` +
          `<@${payout.user_id}>'s new 30-day total is **${formatCurrency(newTotal)}**. Rank: ${rankText}.`;

        const embed = new EmbedBuilder()
          .setTitle('Payout Rolled Off')
          .setDescription(description)
          .setColor(0x2196f3)
          .setFooter({ text: `Payout ID: ${payout.id}` })
          .setTimestamp();

        await channel.send({ embeds: [embed] });
        markRolloffAnnounced(payout.id);
        announced++;
      } catch (err) {
        console.error(`[RolloffAnnouncements] Failed to announce rolloff for payout #${payout.id}:`, err);
      }
    }

    if (announced > 0) {
      console.log(`[RolloffAnnouncements] Announced ${announced} rolloff(s).`);
    }
  } catch (error) {
    console.error('[RolloffAnnouncements] Error:', error);
  }
}
