import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../types';
import { assertPayoutChannel } from '../utils/permissions';

export const help: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available payout bot commands'),

  async execute(interaction) {
    if (!(await assertPayoutChannel(interaction))) return;

    const embed = new EmbedBuilder()
      .setTitle('Payout Bot Commands')
      .setColor(0x5865f2)
      .addFields(
        {
          name: '/addpayout',
          value: 'Log a new payout. Provide the amount and a proof screenshot.',
        },
        {
          name: '/mypayouts',
          value: 'View your payouts from the last 30 days (with payout IDs).',
        },
        {
          name: '/removepayout',
          value: 'Remove one of your own payouts by ID.',
        },
        {
          name: '/leaderboard',
          value: 'View the top 10 payout rankings (30-day rolling).',
        },
        {
          name: '/adminremovepayout',
          value: 'Remove any user\'s payout by ID. (Admin only)',
        },
        {
          name: '/help',
          value: 'Show this help message.',
        },
      )
      .setFooter({ text: 'Rankings are based on a rolling 30-day window and update automatically.' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
