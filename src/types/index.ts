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
}
