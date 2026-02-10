import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../types';
import { getUserTimeoutStats } from '../database/timeouts';
import { formatDuration } from '../utils/formatters';

export const timeoutstats: Command = {
  data: new SlashCommandBuilder()
    .setName('timeoutstats')
    .setDescription('View timeout stats for yourself or another user (30-day rolling)')
    .addUserOption(option =>
      option.setName('user').setDescription('The user to check (defaults to you)').setRequired(false),
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user') ?? interaction.user;
    const guildId = interaction.guildId!;

    const stats = getUserTimeoutStats(target.id, guildId);

    const isSelf = target.id === interaction.user.id;

    if (stats.count === 0) {
      await interaction.reply({
        content: isSelf
          ? 'You have no timeouts in the last 30 days.'
          : `${target} has no timeouts in the last 30 days.`,
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(isSelf ? 'Your Timeout Stats (Last 30 Days)' : `${target.username}'s Timeout Stats (Last 30 Days)`)
      .setDescription(
        `**Timeouts:** ${stats.count}\n**Total time:** ${formatDuration(stats.totalDurationMs)}`,
      )
      .setColor(0x9c27b0)
      .setFooter({ text: '30-day rolling window' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
