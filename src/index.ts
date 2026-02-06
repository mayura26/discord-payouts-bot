import { Client, GatewayIntentBits, Events } from 'discord.js';
import { config } from './config';
import { commands } from './commands';
import { startScheduler } from './services/scheduler';
import { verifyRolesExist } from './utils/roles';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`[Bot] Logged in as ${readyClient.user.tag}`);

  // Verify position roles exist
  try {
    const guild = await readyClient.guilds.fetch(config.guildId);
    await guild.roles.fetch();
    await verifyRolesExist(guild);
  } catch (error) {
    console.error('[Bot] Failed to verify roles:', error);
  }

  // Start the daily ranking scheduler
  startScheduler(readyClient);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) {
    console.warn(`[Bot] Unknown command: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`[Bot] Error executing /${interaction.commandName}:`, error);

    const reply = {
      content: 'An error occurred while processing your command.',
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
});

process.on('unhandledRejection', (error) => {
  console.error('[Bot] Unhandled rejection:', error);
});

client.login(config.token);
