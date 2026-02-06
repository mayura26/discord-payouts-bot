import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../types';
import { assertPayoutChannel } from '../utils/permissions';
import { getTopUsers } from '../database/payouts';
import { formatCurrency } from '../utils/formatters';

const MEDAL_EMOJIS = ['🥇', '🥈', '🥉'];

export const leaderboard: Command = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the top 10 payout rankings (30-day rolling)'),

  async execute(interaction) {
    if (!(await assertPayoutChannel(interaction))) return;

    const guildId = interaction.guildId!;
    const topUsers = getTopUsers(guildId, 10);

    if (topUsers.length === 0) {
      await interaction.reply({
        content: 'No payouts recorded in the last 30 days.',
        ephemeral: true,
      });
      return;
    }

    const lines = topUsers.map((user, index) => {
      const prefix = index < 3 ? MEDAL_EMOJIS[index] : `**#${index + 1}**`;
      return `${prefix} <@${user.user_id}> — ${formatCurrency(user.total_amount)}`;
    });

    const embed = new EmbedBuilder()
      .setTitle('Payout Leaderboard (30-Day Rolling)')
      .setDescription(lines.join('\n'))
      .setColor(0xffd700)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
