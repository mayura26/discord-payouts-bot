import { SlashCommandBuilder } from 'discord.js';
import { Command } from '../types';
import { assertPayoutChannel } from '../utils/permissions';
import { getPayoutById, removeOwnPayout, getUserTotal } from '../database/payouts';
import { formatCurrency } from '../utils/formatters';
import { triggerRankingRecalculation } from '../services/ranking';

export const removepayout: Command = {
  data: new SlashCommandBuilder()
    .setName('removepayout')
    .setDescription('Remove one of your own payouts')
    .addIntegerOption(option =>
      option
        .setName('payout_id')
        .setDescription('ID of the payout to remove (use /mypayouts to see IDs)')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    if (!(await assertPayoutChannel(interaction))) return;

    const payoutId = interaction.options.getInteger('payout_id', true);
    const userId = interaction.user.id;
    const guildId = interaction.guildId!;

    const payout = getPayoutById(payoutId);
    if (!payout || payout.removed) {
      await interaction.reply({
        content: 'Payout not found or already removed.',
        ephemeral: true,
      });
      return;
    }

    if (payout.user_id !== userId) {
      await interaction.reply({
        content: 'You can only remove your own payouts. Ask an admin to use `/adminremovepayout`.',
        ephemeral: true,
      });
      return;
    }

    const removed = removeOwnPayout(payoutId, userId);
    if (!removed) {
      await interaction.reply({
        content: 'Failed to remove payout. It may have already been removed.',
        ephemeral: true,
      });
      return;
    }

    const newTotal = getUserTotal(userId, guildId);

    await interaction.reply({
      content: `Payout #${payoutId} (${formatCurrency(payout.amount)}) has been removed. Your new 30-day total is **${formatCurrency(newTotal)}**.`,
      ephemeral: true,
    });

    if (interaction.guild) {
      await interaction.guild.members.fetch();
      await interaction.guild.roles.fetch();
      triggerRankingRecalculation(interaction.guild).catch(err =>
        console.error('[RemovePayout] Ranking recalculation error:', err)
      );
    }
  },
};
