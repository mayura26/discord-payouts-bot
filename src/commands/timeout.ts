import { SlashCommandBuilder, GuildMember, MessageFlags } from 'discord.js';
import { Command, type BotConfig } from '../types';
import { config } from '../config';
import { insertTimeout } from '../database/timeouts';

/** Per (executor, target) pair: "executorId-targetId" → last time this executor timed out this target */
const cooldowns = new Map<string, number>();

const TIMEOUT_MS = 71_000;      // 1 min 11 sec
const COOLDOWN_MS = 60 * 60_000; // 1 hour per pair (you can't timeout the same person again for 1hr)

/** Piecewise linear: anchors at diff 1, 3, 5, 10, 12. Returns % success chance (0–100). */
function getTimeoutSuccessChance(rankDiff: number, c: BotConfig): number {
  const anchors: [number, number][] = [
    [1, c.timeoutChanceDiff1],
    [3, c.timeoutChanceDiff3],
    [5, c.timeoutChanceDiff5],
    [10, c.timeoutChanceDiff10],
    [12, c.timeoutChanceDiff12],
  ];
  const d = Math.max(1, Math.min(12, Math.round(rankDiff)));
  let i = 0;
  while (i < anchors.length - 1 && anchors[i + 1][0] < d) i++;
  const [x0, y0] = anchors[i];
  const [x1, y1] = anchors[i + 1];
  if (x0 === x1) return y0;
  const t = (d - x0) / (x1 - x0);
  return y0 + t * (y1 - y0);
}

const ROLL_MAX = 1000; // 1-1000 scale for probability feedback

/** Roll 1-1000, succeed if roll <= threshold. Returns { success, roll, threshold } for feedback. */
function rollWithFeedback(successChancePercent: number): { success: boolean; roll: number; threshold: number } {
  const roll = Math.floor(Math.random() * ROLL_MAX) + 1;
  const threshold = Math.round((successChancePercent / 100) * ROLL_MAX);
  return { success: roll <= threshold, roll, threshold };
}

function rollFeedback(roll: number, threshold: number): string {
  return ` (Roll: ${roll}/${ROLL_MAX}, needed ≤${threshold})`;
}

/** Returns the user's position rank (1 = highest, 12 = lowest) or null if unranked. */
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
    .setDescription('Timeout a user for 1 minute 11 seconds (you can\'t timeout the same person again for 1 hour)')
    .addUserOption(option =>
      option.setName('user').setDescription('The user to timeout').setRequired(true),
    )
    .addStringOption(option =>
      option.setName('message').setDescription('Optional reason or message for the timeout').setRequired(false),
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user', true);
    const message = interaction.options.getString('message') ?? undefined;

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
    let rankRollFeedback: string | null = null;
    if (targetRank === null) {
      // Target unranked, executor ranked → always timeout target
      backfire = false;
    } else if (executorRank !== null && executorRank < targetRank) {
      // Executor higher rank than target → always timeout target
      backfire = false;
    } else {
      // Target same rank or higher (or executor unranked) → % chance based on rank diff
      const executorEffective = executorRank ?? config.timeoutUnrankedRank;
      const rankDiff = executorEffective - targetRank;
      const successChance = getTimeoutSuccessChance(rankDiff, config);
      const { success, roll, threshold } = rollWithFeedback(successChance);
      backfire = !success;
      rankRollFeedback = rollFeedback(roll, threshold);
    }

    const victim = backfire ? executorMember : targetMember;
    const durationMs = backfire ? TIMEOUT_MS * 2 : TIMEOUT_MS;
    const durationSec = durationMs / 1000;

    // Per (executor, target) cooldown: you can't timeout the same person again for 1 hour
    // Higher-ranked executors can override with % chance (inverted curve: 12 ranks above = 25%, 1 above = 0.1%)
    const pairKey = `${interaction.user.id}-${target.id}`;
    const lastUsed = cooldowns.get(pairKey);
    const onCooldown = lastUsed && Date.now() - lastUsed < COOLDOWN_MS;
    let cooldownRollFeedback: string | null = null;
    if (onCooldown) {
      let cooldownBypassed = false;
      if (targetRank !== null && executorRank !== null && executorRank < targetRank) {
        const overrideRankDiff = targetRank - executorRank; // positive when executor higher
        const overrideChance = getTimeoutSuccessChance(12 - overrideRankDiff, config);
        const { success, roll, threshold } = rollWithFeedback(overrideChance);
        cooldownBypassed = success;
        cooldownRollFeedback = rollFeedback(roll, threshold);
      }
      if (!cooldownBypassed) {
        const remainingMin = Math.ceil((COOLDOWN_MS - (Date.now() - lastUsed)) / 60_000);
        const feedback = cooldownRollFeedback ?? '';
        await interaction.reply({
          content: `${interaction.user} tried to timeout ${target} again too soon! Can't timeout them for **${remainingMin}** more minute${remainingMin === 1 ? '' : 's'}.${feedback}`,
        });
        return;
      }
    }

    try {
      await victim.timeout(durationMs, message || 'Timeout command');
    } catch {
      await interaction.reply({
        content: `I don't have permission to timeout ${victim.user}.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    insertTimeout(victim.id, guild.id, durationMs, interaction.user.id, backfire ? 1 : 0);

    // Set per (executor, target) cooldown after successful action
    cooldowns.set(pairKey, Date.now());

    const feedbackSuffix = [rankRollFeedback, cooldownRollFeedback].filter(Boolean).join(' ');

    if (backfire) {
      await interaction.reply(
        `${interaction.user} tried to timeout ${target} but it backfired! ${interaction.user} has been timed out for ${durationSec} seconds!${feedbackSuffix}${message ? ` Reason: ${message}` : ''}`,
      );
    } else {
      await interaction.reply(
        `${target} has been timed out for ${durationSec} seconds by ${interaction.user}!${feedbackSuffix}${message ? ` Reason: ${message}` : ''}`,
      );
    }
  },
};
