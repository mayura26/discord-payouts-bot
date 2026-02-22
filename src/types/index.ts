import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
} from 'discord.js';

/** Shape of a slash command module */
export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

/** A row from the payouts table */
export interface PayoutRow {
  id: number;
  user_id: string;
  guild_id: string;
  amount: number;
  proof_url: string;
  created_at: string;
  removed: number;
}

/** A user with their ranked total */
export interface RankedUser {
  user_id: string;
  total_amount: number;
}

/** Bot configuration */
export interface BotConfig {
  token: string;
  clientId: string;
  guildId: string;
  payoutChannelId: string;
  positionRoleIds: string[];
  databasePath: string;
  rankingCron: string;
  backupCron: string;
  backupRetentionDays: number;
  /** Timeout success chance anchors: % at rank diff 1, 3, 5, 10, 12 */
  timeoutChanceDiff1: number;
  timeoutChanceDiff3: number;
  timeoutChanceDiff5: number;
  timeoutChanceDiff10: number;
  timeoutChanceDiff12: number;
  /** Effective rank for unranked users (below rank 12) */
  timeoutUnrankedRank: number;
  /** % added per cooldown spam attempt (first attempt = 0%, then scales) */
  timeoutBackfireIncrement: number;
  /** Max % backfire chance when spamming cooldown */
  timeoutBackfireCap: number;
}
