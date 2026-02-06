import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { Command } from '../types';
import { assertPayoutChannel, isAdmin } from '../utils/permissions';
import { getPayoutById, removePayout, getUserTotal } from '../database/payouts';
import { formatCurrency } from '../utils/formatters';
import { triggerRankingRecalculation } from '../services/ranking';

export const adminremovepayout: Command = {
  data: new SlashCommandBuilder()
    .setName('adminremovepayout')
    .setDescription('Remove any user\'s payout (Admin only)')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user whose payout to remove')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('payout_id')
        .setDescription('ID of the payout to remove')
        .setRequired(true)
        .setMinValue(1)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!(await assertPayoutChannel(interaction))) return;

    if (!isAdmin(interaction)) {
      await interaction.reply({
        content: 'You need Administrator permission to use this command.',
        ephemeral: true,
      });
      return;
    }

    const targetUser = interaction.options.getUser('user', true);
    const payoutId = interaction.options.getInteger('payout_id', true);
    const guildId = interaction.guildId!;

    const payout = getPayoutById(payoutId);
    if (!payout || payout.removed) {
      await interaction.reply({
        content: 'Payout not found or already removed.',
        ephemeral: true,
      });
      return;
    }

    if (payout.user_id !== targetUser.id) {
      await interaction.reply({
        content: `Payout #${payoutId} does not belong to ${targetUser}. It belongs to <@${payout.user_id}>.`,
        ephemeral: true,
      });
      return;
    }

    const removed = removePayout(payoutId);
    if (!removed) {
      await interaction.reply({
        content: 'Failed to remove payout. It may have already been removed.',
        ephemeral: true,
      });
      return;
    }

    const newTotal = getUserTotal(targetUser.id, guildId);

    await interaction.reply({
      content: `Removed payout #${payoutId} (${formatCurrency(payout.amount)}) from ${targetUser}. Their new 30-day total is **${formatCurrency(newTotal)}**.`,
    });

    if (interaction.guild) {
      await interaction.guild.members.fetch();
      await interaction.guild.roles.fetch();
      triggerRankingRecalculation(interaction.guild).catch(err =>
        console.error('[AdminRemovePayout] Ranking recalculation error:', err)
      );
    }
  },
};
