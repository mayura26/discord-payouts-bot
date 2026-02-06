import { REST, Routes } from 'discord.js';
import { config } from './config';
import { commands } from './commands';

async function deployCommands() {
  const rest = new REST().setToken(config.token);

  const commandData = [...commands.values()].map(cmd => cmd.data.toJSON());

  console.log(`[Deploy] Registering ${commandData.length} slash commands...`);

  await rest.put(
    Routes.applicationGuildCommands(config.clientId, config.guildId),
    { body: commandData },
  );

  console.log(`[Deploy] Successfully registered ${commandData.length} commands.`);
}

deployCommands().catch((error) => {
  console.error('[Deploy] Failed to register commands:', error);
  process.exit(1);
});
