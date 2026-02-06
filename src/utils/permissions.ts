import { ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { config } from '../config';

/** Returns true if the interaction is in the designated payout channel. Replies with an error if not. */
export async function assertPayoutChannel(interaction: ChatInputCommandInteraction): Promise<boolean> {
  if (interaction.channelId !== config.payoutChannelId) {
    await interaction.reply({
      content: `This command can only be used in <#${config.payoutChannelId}>.`,
      ephemeral: true,
    });
    return false;
  }
  return true;
}

/** Returns true if the user has Administrator permission. */
export function isAdmin(interaction: ChatInputCommandInteraction): boolean {
  return interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ?? false;
}
