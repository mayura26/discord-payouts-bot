import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../types';
import { assertPayoutChannel } from '../utils/permissions';
import { getUserPayouts, getUserTotal } from '../database/payouts';
import { formatCurrency, formatRelativeTime } from '../utils/formatters';

export const mypayouts: Command = {
  data: new SlashCommandBuilder()
    .setName('mypayouts')
    .setDescription('View your payouts from the last 30 days'),

  async execute(interaction) {
    if (!(await assertPayoutChannel(interaction))) return;

    const userId = interaction.user.id;
    const guildId = interaction.guildId!;

    const payouts = getUserPayouts(userId, guildId);
    const total = getUserTotal(userId, guildId);

    if (payouts.length === 0) {
      await interaction.reply({
        content: 'You have no payouts in the last 30 days.',
        ephemeral: true,
      });
      return;
    }

    const lines = payouts.map(p =>
      `**ID:** ${p.id} | ${formatCurrency(p.amount)} | ${formatRelativeTime(p.created_at)} | [Proof](${p.proof_url})`
    );

    // Truncate if too long for embed description (4096 char limit)
    let description = lines.join('\n');
    if (description.length > 4000) {
      description = description.substring(0, 4000) + '\n*...truncated*';
    }

    const embed = new EmbedBuilder()
      .setTitle('Your Payouts (Last 30 Days)')
      .setDescription(description)
      .setColor(0x2196f3)
      .setFooter({ text: `Total: ${formatCurrency(total)} | ${payouts.length} payout(s)` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
