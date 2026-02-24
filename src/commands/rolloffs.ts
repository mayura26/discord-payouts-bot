import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../types';
import { getNextRolloffs } from '../database/payouts';
import { formatCurrency } from '../utils/formatters';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function formatRolloffTime(createdAt: string): string {
  const rolloffMs = new Date(createdAt + 'Z').getTime() + THIRTY_DAYS_MS;
  const unix = Math.floor(rolloffMs / 1000);
  return `<t:${unix}:R>`;
}

export const rolloffs: Command = {
  data: new SlashCommandBuilder()
    .setName('rolloffs')
    .setDescription('Show the next 3 payouts that will roll off the 30-day window (across all users).'),

  async execute(interaction) {
    const guildId = interaction.guildId!;
    const payouts = getNextRolloffs(guildId, 3);

    if (payouts.length === 0) {
      await interaction.reply({
        content: 'No payouts in the 30-day window.',
        ephemeral: true,
      });
      return;
    }

    const lines = payouts.map(
      (p) =>
        `<@${p.user_id}> — ${formatCurrency(p.amount)} (payout #${p.id}) · rolls off ${formatRolloffTime(p.created_at)}`
    );

    const embed = new EmbedBuilder()
      .setTitle('Next 3 Payout Rolloffs (30-Day Window)')
      .setDescription(lines.join('\n'))
      .setColor(0x2196f3)
      .setFooter({ text: 'Payouts leave the 30-day window when they are older than 30 days.' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
