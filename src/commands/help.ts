import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../types';

export const help: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available payout bot commands'),

  async execute(interaction) {
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
          value: 'View the top 12 payout rankings (30-day rolling).',
        },
        {
          name: '/adminremovepayout',
          value: 'Remove any user\'s payout by ID. (Admin only)',
        },
        {
          name: '/timeout',
          value: 'Timeout a user for 1 min 11 sec. Timing out someone above your rank has a % chance to succeed (based on rank diff); otherwise it backfires. Higher ranks can override the 1hr cooldown with a % chance.',
        },
        {
          name: '/timeoutstats',
          value: 'View your timeout stats or another user\'s (30-day rolling).',
        },
        {
          name: '/timeoutleaderboard',
          value: 'View top 10 users by total time timed out (30-day rolling).',
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
