import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../types';
import { getTopUsersAllTime } from '../database/payouts';
import { formatCurrency } from '../utils/formatters';

const MEDAL_EMOJIS = ['🥇', '🥈', '🥉'];

export const historicalleaderboard: Command = {
  data: new SlashCommandBuilder()
    .setName('historicalleaderboard')
    .setDescription('View the top 12 all-time payout rankings'),

  async execute(interaction) {
    const guildId = interaction.guildId!;
    const topUsers = getTopUsersAllTime(guildId, 12);

    if (topUsers.length === 0) {
      await interaction.reply({
        content: 'No payouts recorded.',
        ephemeral: true,
      });
      return;
    }

    const lines = topUsers.map((user, index) => {
      const prefix = index < 3 ? MEDAL_EMOJIS[index] : `**#${index + 1}**`;
      return `${prefix} <@${user.user_id}> — ${formatCurrency(user.total_amount)}`;
    });

    const embed = new EmbedBuilder()
      .setTitle('Payout Leaderboard (All Time)')
      .setDescription(lines.join('\n'))
      .setColor(0xffd700)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
