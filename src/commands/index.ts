import { Collection } from 'discord.js';
import { Command } from '../types';
import { addpayout } from './addpayout';
import { removepayout } from './removepayout';
import { adminremovepayout } from './adminremovepayout';
import { leaderboard } from './leaderboard';
import { mypayouts } from './mypayouts';
import { help } from './help';
import { timeout } from './timeout';

export const commands = new Collection<string, Command>();

const commandList: Command[] = [
  addpayout,
  removepayout,
  adminremovepayout,
  leaderboard,
  mypayouts,
  help,
  timeout,
];

for (const command of commandList) {
  commands.set(command.data.name, command);
}
