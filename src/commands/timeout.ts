import { SlashCommandBuilder, GuildMember, MessageFlags } from 'discord.js';
import { Command } from '../types';
import { config } from '../config';

/** Per-victim cooldown: userId (person timed out) → last time they were timed out */
const cooldowns = new Map<string, number>();

const TIMEOUT_MS = 71_000;      // 1 min 11 sec
const COOLDOWN_MS = 60 * 60_000; // 1 hour per person

/** Returns the user's position rank (1 = highest, 10 = lowest) or null if unranked. */
function getUserRank(member: GuildMember): number | null {
  for (let i = 0; i < config.positionRoleIds.length; i++) {
    if (member.roles.cache.has(config.positionRoleIds[i])) {
      return i + 1;
    }
  }
  return null;
}

export const timeout: Command = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a user for 1 minute 11 seconds (each person can only be timed out once per hour)')
    .addUserOption(option =>
      option.setName('user').setDescription('The user to timeout').setRequired(true),
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user', true);

    // Block self-targeting
    if (target.id === interaction.user.id) {
      await interaction.reply({ content: 'You can\'t timeout yourself.', flags: MessageFlags.Ephemeral });
      return;
    }

    // Block bots
    if (target.bot) {
      await interaction.reply({ content: 'You can\'t timeout a bot.', flags: MessageFlags.Ephemeral });
      return;
    }

    const guild = interaction.guild;
    if (!guild) return;

    // Fetch both members
    const executorMember = await guild.members.fetch(interaction.user.id);
    const targetMember = await guild.members.fetch(target.id);

    const executorRank = getUserRank(executorMember);
    const targetRank = getUserRank(targetMember);

    // Determine who gets timed out
    let backfire = false;
    if (executorRank === null) {
      // No rank → always backfires
      backfire = true;
    } else if (targetRank === null) {
      // Target unranked, executor ranked → timeout target
      backfire = false;
    } else if (executorRank < targetRank) {
      // Lower number = higher rank → timeout target
      backfire = false;
    } else {
      // Target is same rank or higher → backfire
      backfire = true;
    }

    const victim = backfire ? executorMember : targetMember;
    const durationMs = backfire ? TIMEOUT_MS * 2 : TIMEOUT_MS;
    const durationSec = durationMs / 1000;

    // Per-person cooldown: each victim can only be timed out once per hour
    const lastTimedOut = cooldowns.get(victim.id);
    if (lastTimedOut && Date.now() - lastTimedOut < COOLDOWN_MS) {
      const remainingMin = Math.ceil((COOLDOWN_MS - (Date.now() - lastTimedOut)) / 60_000);
      await interaction.reply({
        content: `${victim.user} can only be timed out once per hour. Try again in **${remainingMin}** minute${remainingMin === 1 ? '' : 's'}.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      await victim.timeout(durationMs, 'Timeout command');
    } catch {
      await interaction.reply({
        content: `I don't have permission to timeout ${victim.user}.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Set per-victim cooldown after successful action
    cooldowns.set(victim.id, Date.now());

    if (backfire) {
      await interaction.reply(
        `${interaction.user} tried to timeout ${target} but it backfired! ${interaction.user} has been timed out for ${durationSec} seconds!`,
      );
    } else {
      await interaction.reply(
        `${target} has been timed out for ${durationSec} seconds by ${interaction.user}!`,
      );
    }
  },
};
