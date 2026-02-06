import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../types';
import { assertPayoutChannel } from '../utils/permissions';
import { insertPayout, getUserTotal, getTopUsers } from '../database/payouts';
import { formatCurrency } from '../utils/formatters';
import { triggerRankingRecalculation } from '../services/ranking';

export const addpayout: Command = {
  data: new SlashCommandBuilder()
    .setName('addpayout')
    .setDescription('Log a new payout from a prop firm')
    .addNumberOption(option =>
      option
        .setName('amount')
        .setDescription('Payout amount in dollars')
        .setRequired(true)
        .setMinValue(0.01)
        .setMaxValue(999999999.99)
    )
    .addAttachmentOption(option =>
      option
        .setName('proof')
        .setDescription('Screenshot or image proof of payout')
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!(await assertPayoutChannel(interaction))) return;

    const amount = interaction.options.getNumber('amount', true);
    const proof = interaction.options.getAttachment('proof', true);

    if (!proof.contentType?.startsWith('image/')) {
      await interaction.reply({
        content: 'Proof must be an image file (PNG, JPG, etc.).',
        ephemeral: true,
      });
      return;
    }

    const guildId = interaction.guildId!;
    const userId = interaction.user.id;

    const payoutId = insertPayout(userId, guildId, amount, proof.url);
    const total = getUserTotal(userId, guildId);

    // Determine rank
    const topUsers = getTopUsers(guildId, 100);
    const rankIndex = topUsers.findIndex(u => u.user_id === userId);
    const rank = rankIndex >= 0 ? rankIndex + 1 : null;

    const embed = new EmbedBuilder()
      .setTitle('Payout Received')
      .setDescription(
        `${interaction.user}'s 30-day total is **${formatCurrency(total)}**.` +
        (rank ? ` Current rank: **#${rank}**` : '')
      )
      .setImage(proof.url)
      .setColor(0x00c853)
      .setFooter({ text: `Payout ID: ${payoutId}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Recalculate rankings in the background
    if (interaction.guild) {
      await interaction.guild.members.fetch();
      await interaction.guild.roles.fetch();
      triggerRankingRecalculation(interaction.guild).catch(err =>
        console.error('[AddPayout] Ranking recalculation error:', err)
      );
    }
  },
};
