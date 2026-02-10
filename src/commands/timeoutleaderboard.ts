import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../types';
import { getTopTimedOutUsers } from '../database/timeouts';
import { formatDuration } from '../utils/formatters';

const MEDAL_EMOJIS = ['🥇', '🥈', '🥉'];

export const timeoutleaderboard: Command = {
  data: new SlashCommandBuilder()
    .setName('timeoutleaderboard')
    .setDescription('View top 10 users by total time timed out (30-day rolling)'),

  async execute(interaction) {
    const guildId = interaction.guildId!;
    const topUsers = getTopTimedOutUsers(guildId, 10);

    if (topUsers.length === 0) {
      await interaction.reply({
        content: 'No timeouts recorded in the last 30 days.',
        ephemeral: true,
      });
      return;
    }

    const lines = topUsers.map((user, index) => {
      const prefix = index < 3 ? MEDAL_EMOJIS[index] : `**#${index + 1}**`;
      return `${prefix} <@${user.user_id}> — ${formatDuration(user.total_duration_ms)} (${user.count} timeout${user.count === 1 ? '' : 's'})`;
    });

    const embed = new EmbedBuilder()
      .setTitle('Timeout Leaderboard (30-Day Rolling)')
      .setDescription(lines.join('\n'))
      .setColor(0x9c27b0)
      .setFooter({ text: 'Total time timed out' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
